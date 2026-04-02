import {
  BUILDINGS,
  FOOD_CONSUMPTION_PER_PUPPY_PER_TICK,
  INITIAL_POPULATION_CAP,
  JOBS,
  INITIAL_RESOURCE_LIMITS,
  RESOURCES,
  POPULATION_GROWTH_RATE,
  type GameState,
} from '@/engine/types'
import { rebalanceJobAssignments } from '@/engine/actions'
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
  let populationCap = INITIAL_POPULATION_CAP

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
  const limits: Record<string, number> = { ...INITIAL_RESOURCE_LIMITS }

  BUILDINGS.forEach((building) => {
    const count = gameState.buildings[building.id] || 0
    if (!building.resourceLimitBonuses || count <= 0) {
      return
    }

    for (const [resourceId, amount] of Object.entries(building.resourceLimitBonuses)) {
      limits[resourceId] = (limits[resourceId] || 0) + amount * count
    }
  })

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
  const currentPopulation = state.population || 0
  const currentFood = resourceCounts.food || 0
  const foodNeed = currentPopulation * FOOD_CONSUMPTION_PER_PUPPY_PER_TICK
  const foodDeficit = Math.max(0, foodNeed - currentFood)

  resourceCounts.food = Math.max(0, currentFood - foodNeed)
  let nextProgress = state.populationGrowthProgress || 0
  let nextPopulation = min(currentPopulation, populationCap)

  if (foodDeficit > 0) {
    if (nextProgress > 0) {
      nextProgress = 0
    }

    const starvationDelta =
      (foodDeficit / FOOD_CONSUMPTION_PER_PUPPY_PER_TICK) * POPULATION_GROWTH_RATE
    nextProgress -= starvationDelta
  } else if (state.isDomesticateEnabled && nextPopulation < populationCap) {
    const domesticateCost = FOOD_CONSUMPTION_PER_PUPPY_PER_TICK
    if (resourceCounts.food >= domesticateCost) {
      resourceCounts.food -= domesticateCost
      nextProgress = Math.max(0, nextProgress) + POPULATION_GROWTH_RATE
    }
  }

  if (nextProgress >= 1) {
    const gainedPopulation = Math.floor(nextProgress)
    nextPopulation = Math.min(populationCap, nextPopulation + gainedPopulation)
    nextProgress = nextPopulation >= populationCap ? 0 : nextProgress - gainedPopulation
  }

  if (nextProgress <= -1) {
    const lostPopulation = Math.floor(-nextProgress)
    nextPopulation = Math.max(0, nextPopulation - lostPopulation)
    nextProgress = nextPopulation <= 0 ? 0 : nextProgress + lostPopulation
  }

  return {
    population: nextPopulation,
    growthProgress: nextProgress,
  }
}

export function tick(state: GameState): GameState {
  const nextPopulationCap = calculatePopulationCap(state)
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

  const populationUpdate = applyPopulationGrowth(state, newResourceCounts, nextPopulationCap)

  for (const [resourceId, amount] of Object.entries(newResourceCounts)) {
    newResourceCounts[resourceId] = min(amount, nextLimits[resourceId] || 0)
  }

  const resourceDeltaPerTick: Record<string, number> = {}
  RESOURCES.forEach((resource) => {
    resourceDeltaPerTick[resource.id] = (newResourceCounts[resource.id] || 0) - (state.resourceCounts[resource.id] || 0)
  })

  // tick 的时候，先计算资源生产和消耗，再计算人口和资源的相互影响，再应用资源上限。
  // 这样玩家在这一 tick 内获得的资源可以被这一 tick 内增加的人口消耗掉。

  return {
    ...state,
    resourceCounts: newResourceCounts,
    resourceLimits: nextLimits,
    resourceDeltaPerTick,
    population: populationUpdate.population,
    populationCap: nextPopulationCap,
    jobAssignments: rebalanceJobAssignments(state.jobAssignments, populationUpdate.population),
    populationGrowthProgress: populationUpdate.growthProgress,
    tickCount: state.tickCount + 1,
    lastTickTime: Date.now(),
  }
}
