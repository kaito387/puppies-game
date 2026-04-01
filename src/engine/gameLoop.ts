import {
  BASE_POPULATION_CAP,
  BUILDINGS,
  FOOD_CONSUMPTION_PER_PUPPY_PER_TICK,
  JOBS,
  RESOURCE_LIMITS,
  RESOURCES,
  POPULATION_GROWTH_BASE_RATE,
  type GameState,
} from '@/engine/types'
import { min } from '@/engine/utils'

export function calculateProduction(gameState: GameState): Record<string, number> {
  const production: Record<string, number> = {}

  RESOURCES.forEach((resource) => {
    production[resource.id] = 0
  })

  BUILDINGS.forEach((building) => {
    const count = gameState.buildings[building.id] || 0
    for (const [resourceId, amount] of Object.entries(building.productionPerTick)) {
      production[resourceId] += amount * count
    }
  })

  return production
}

export function calculatePopulationCap(gameState: GameState): number {
  let populationCap = BASE_POPULATION_CAP

  BUILDINGS.forEach((building) => {
    const count = gameState.buildings[building.id] || 0
    if (!building.populationCapBonus || count <= 0) {
      return
    }

    populationCap += building.populationCapBonus * count
  })

  return populationCap
}

export function calculateResourceLimits(gameState: GameState): Record<string, number> {
  const limits: Record<string, number> = { ...RESOURCE_LIMITS }

  BUILDINGS.forEach((building) => {
    const count = gameState.buildings[building.id] || 0
    if (!building.resourceLimitBonuses || count <= 0) {
      return
    }

    for (const [resourceId, amount] of Object.entries(building.resourceLimitBonuses)) {
      limits[resourceId] = (limits[resourceId] || 0) + amount * count
    }
  })

  limits.puppies = calculatePopulationCap(gameState)

  return limits
}

export function calculateJobProduction(gameState: GameState): Record<string, number> {
  const production: Record<string, number> = {}

  RESOURCES.forEach((resource) => {
    production[resource.id] = 0
  })

  JOBS.forEach((job) => {
    const assigned = gameState.jobAssignments[job.id] || 0
    if (assigned <= 0) {
      return
    }

    for (const [resourceId, amount] of Object.entries(job.productionPerTick)) {
      production[resourceId] += amount * assigned
    }
  })

  return production
}

export function applyPopulationGrowth(
  state: GameState,
  resourceCounts: Record<string, number>,
  populationCap: number,
): { population: number; growthProgress: number } {
  const currentPopulation = Math.floor(resourceCounts.puppies || 0)
  const currentFood = resourceCounts.food || 0
  const foodNeed = currentPopulation * FOOD_CONSUMPTION_PER_PUPPY_PER_TICK

  const foodAfterUpkeep = Math.max(0, currentFood - foodNeed)
  resourceCounts.food = min(foodAfterUpkeep, state.resourceLimits.food || foodAfterUpkeep)
  // 此处修改了 resourceCounts.food

  if (currentFood < foodNeed || currentPopulation >= populationCap) {
    return {
      population: min(currentPopulation, populationCap),
      growthProgress: currentPopulation >= populationCap ? 0 : state.populationGrowthProgress,
    } // 食物不足或者人口已经满了，停止增长
  }

  const crowding = populationCap <= 0 ? 1 : currentPopulation / populationCap
  const growthPerTick = POPULATION_GROWTH_BASE_RATE * (1 - crowding)
  const totalGrowthProgress = state.populationGrowthProgress + growthPerTick
  const newPuppies = Math.floor(totalGrowthProgress)
  const nextPopulation = min(currentPopulation + newPuppies, populationCap)
  const growthProgress = nextPopulation >= populationCap ? 0 : totalGrowthProgress - newPuppies

  return {
    population: nextPopulation,
    growthProgress,
  }
}

export function tick(state: GameState): GameState {
  const nextLimits = calculateResourceLimits(state)

  const buildingProduction = calculateProduction(state)
  const jobProduction = calculateJobProduction(state)
  const production: Record<string, number> = { ...buildingProduction }
  for (const [resourceId, amount] of Object.entries(jobProduction)) {
    production[resourceId] = (production[resourceId] || 0) + amount
  }

  const newResourceCounts: Record<string, number> = { ...state.resourceCounts }
  for (const [resourceId, amount] of Object.entries(production)) {
    newResourceCounts[resourceId] = (newResourceCounts[resourceId] || 0) + amount
  }

  const populationUpdate = applyPopulationGrowth(state, newResourceCounts, nextLimits.puppies)
  newResourceCounts.puppies = populationUpdate.population

  for (const [resourceId, amount] of Object.entries(newResourceCounts)) {
    newResourceCounts[resourceId] = min(amount, nextLimits[resourceId] || 0)
  }
  
  // tick 的时候，先计算资源生产和消耗，再计算人口和资源的相互影响，再应用资源上限。
  // 这样玩家在这一 tick 内获得的资源可以被这一 tick 内增加的人口消耗掉。

  return {
    ...state,
    resourceCounts: newResourceCounts,
    resourceLimits: nextLimits,
    populationGrowthProgress: populationUpdate.growthProgress,
    tickCount: state.tickCount + 1,
    lastTickTime: Date.now(),
  }
}
