import {
  BUILDINGS,
  JOBS,
  POLICIES,
  RESOURCES,
  SEASON_EFFECTS,
  TECHNOLOGIES,
  WORKSHOP_UNLOCKS,
  type Effect,
  type GameState,
  type GameEvent,
} from '@/engine/types'
import {
  DOG_EXPERIENCE_GAIN_PER_TICK,
  FOOD_CONSUMPTION_PER_PUPPY_PER_TICK,
  GAME_TICK_INTERVAL_MS,
  INITIAL_POPULATION_CAP,
  INITIAL_RESOURCE_LIMITS,
  OFFLINE_PROGRESS_MAX_TICKS,
  POPULATION_GROWTH_RATE,
} from '@/engine/constants'
import { min } from '@/engine/utils'
import { aggregateEffects } from '@/engine/technologies'
import {
  calculateDogOutputMultiplier,
  createDog,
  normalizeDogStatus,
} from '@/engine/dogs'
import { calculateCalendarProgress } from '@/engine/calendar'

export function calculateProduction(gameState: GameState): Record<string, number> {
  const production: Record<string, number> = {}
  const { buildingProductionMultipliers } = aggregateEffects(gameState)

  RESOURCES.forEach((resource) => {
    production[resource.id] = 0
  })

  BUILDINGS.forEach((building) => {
    // only calculate passive production from buildings here, toggleable ones 
    // are handled separately in ToggleableBuildingConversions
    if (building.isToggleable) return 

    const count = gameState.buildings[building.id] || 0
    const multiplier = buildingProductionMultipliers[building.id] || 1

    for (const [resourceId, amount] of Object.entries(building.productionPerTick || {})) {
      production[resourceId] += amount * count * multiplier
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

  const applyResourceLimitEffect = (effect: Effect, occurrences: number = 1): void => {
    if (effect.type !== 'resource_limit' || !effect.targetId) {
      return
    }

    if (effect.mode === 'multiplier') {
      limits[effect.targetId] = (limits[effect.targetId] || 0) * effect.value ** occurrences
    } else if (effect.mode === 'additive') {
      limits[effect.targetId] = (limits[effect.targetId] || 0) + effect.value * occurrences
    } else if (import.meta.env.DEV) {
      console.warn(`未知资源上限效果模式: ${(effect as Effect).mode}`)
    }
  }

  BUILDINGS.forEach((building) => {
    const count = gameState.buildings[building.id] || 0
    if (!building.resourceLimitBonuses || count <= 0) {
      if (building.Effects && count > 0) {
        building.Effects.forEach((effect) => applyResourceLimitEffect(effect, count))
      }
      return
    }

    for (const [resourceId, amount] of Object.entries(building.resourceLimitBonuses)) {
      limits[resourceId] = (limits[resourceId] || 0) + amount * count
    }

    if (building.Effects) {
      building.Effects.forEach((effect) => applyResourceLimitEffect(effect, count))
    }
  })

  for (const techId of gameState.researchedTechIds) {
    const technology = TECHNOLOGIES.find((item) => item.id === techId)
    technology?.effects?.forEach((effect) => applyResourceLimitEffect(effect))
  }

  for (const unlockId of gameState.workshopUnlockIds) {
    const unlock = WORKSHOP_UNLOCKS.find((item) => item.id === unlockId)
    unlock?.effects?.forEach((effect) => applyResourceLimitEffect(effect))
  }

  const seasonEffects = SEASON_EFFECTS[calculateCalendarProgress(gameState).season] || []
  seasonEffects.forEach((effect) => applyResourceLimitEffect(effect))

  for (const policyId of gameState.enactedPolicyIds || []) {
    const policy = POLICIES.find((item) => item.id === policyId)
    policy?.effects?.forEach((effect) => applyResourceLimitEffect(effect))
  }

  return limits
}

export function calculateJobProduction(gameState: GameState): Record<string, number> {
  const production: Record<string, number> = {}
  const { jobProductionMultipliers } = aggregateEffects(gameState)
  const jobsById = new Map(JOBS.map((job) => [job.id, job]))

  RESOURCES.forEach((resource) => {
    production[resource.id] = 0
  })
  

  gameState.dogs.forEach((dog) => {
    if (!dog.currentJobId) {
      return
    }

    const job = jobsById.get(dog.currentJobId)
    if (!job) {
      return
    }

    const jobMultiplier = (jobProductionMultipliers[job.id] || 1)
    const dogMultiplier = calculateDogOutputMultiplier(dog, job.id)

    for (const [resourceId, amount] of Object.entries(job.productionPerTick)) {
      production[resourceId] += amount * jobMultiplier * dogMultiplier
    }
  })

  return production
}

export function toggleableBuildingConversions(
  state: GameState,
  resourceCountsAfterProduction: Record<string, number>
): Record<string, number> {
  const next: Record<string, number> = { ...resourceCountsAfterProduction }
  const { buildingProductionMultipliers } = aggregateEffects(state)

  for (const building of BUILDINGS) {
    if (!building.isToggleable) continue
    const active = state.buildingActiveCounts[building.id] || 0
    if (active <= 0) continue

    const consumption = building.consumptionPerTick || {}
    const totalConsumption: Record<string, number> = {}
    for (const [resourceId, amount] of Object.entries(consumption)) {
      totalConsumption[resourceId] = amount * active
    }

    let canPay = true
    for (const [resourceId, need] of Object.entries(totalConsumption)) {
      if ((next[resourceId] || 0) < need) {
        canPay = false
        break
      }
    }

    if (!canPay) continue

    for (const [resourceId, need] of Object.entries(totalConsumption)) {
      next[resourceId] = (next[resourceId] || 0) - need
    }

    for (const [resourceId, amount] of Object.entries(building.productionPerTick || {})) {
      const multiplier = buildingProductionMultipliers[building.id] || 1
      next[resourceId] = (next[resourceId] || 0) + amount * active * multiplier
    }
  }

  return next
}

export function applyPopulationGrowth(
  state: GameState,
  resourceCounts: Record<string, number>,
  populationCap: number,
): { dogs: GameState['dogs']; growthProgress: number; lostDogs: GameState['dogs'] } {
  const currentPopulation = state.dogs.length
  const currentFood = resourceCounts.food || 0
  const foodNeed = currentPopulation * FOOD_CONSUMPTION_PER_PUPPY_PER_TICK
  const foodDeficit = Math.max(0, foodNeed - currentFood)

  resourceCounts.food = Math.max(0, currentFood - foodNeed)
  let nextProgress = state.populationGrowthProgress || 0
  const nextDogs = [...state.dogs]
  const lostDogs: GameState['dogs'] = []

  if (nextDogs.length > populationCap) {
    const overflow = nextDogs.length - populationCap
    const removed = nextDogs.splice(nextDogs.length - overflow, overflow)
    lostDogs.push(...removed)
  }

  if (foodDeficit > 0) {
    if (nextProgress > 0) {
      nextProgress = 0
    }

    const starvationDelta =
      (foodDeficit / FOOD_CONSUMPTION_PER_PUPPY_PER_TICK) * POPULATION_GROWTH_RATE
    nextProgress -= starvationDelta
  } else if (state.isDomesticateEnabled && nextDogs.length < populationCap) {
    const domesticateCost = FOOD_CONSUMPTION_PER_PUPPY_PER_TICK
    if (resourceCounts.food >= domesticateCost) {
      resourceCounts.food -= domesticateCost
      nextProgress = Math.max(0, nextProgress) + POPULATION_GROWTH_RATE
    }
  }

  if (nextProgress >= 1) {
    const gainedPopulation = Math.floor(nextProgress)
    const availableSlots = Math.max(0, populationCap - nextDogs.length)
    const toAdd = Math.min(availableSlots, gainedPopulation)
    for (let i = 0; i < toAdd; i += 1) {
      nextDogs.push(createDog())
    }
    nextProgress = nextDogs.length >= populationCap ? 0 : nextProgress - gainedPopulation
  }

  if (nextProgress <= -1) {
    const lostPopulation = Math.floor(-nextProgress)
    const toRemove = Math.min(lostPopulation, nextDogs.length)
    const removed = nextDogs.splice(nextDogs.length - toRemove, toRemove)
    lostDogs.push(...removed)
    nextProgress = nextDogs.length <= 0 ? 0 : nextProgress + lostPopulation
  }

  return {
    dogs: nextDogs,
    growthProgress: nextProgress,
    lostDogs,
  }
}

function applyDogExperience(dogs: GameState['dogs']): GameState['dogs'] {
  return dogs.map((dog) => {
    if (!dog.currentJobId) {
      return {
        ...dog,
        status: normalizeDogStatus(dog.currentJobId),
      }
    }

    return {
      ...dog,
      experienceByJob: {
        ...dog.experienceByJob,
        [dog.currentJobId]: (dog.experienceByJob[dog.currentJobId] || 0) + DOG_EXPERIENCE_GAIN_PER_TICK,
      },
    }
  })
}

export function tick(state: GameState): { gameState: GameState; events: GameEvent[] } {
  const nextPopulationCap = calculatePopulationCap(state)
  const nextLimits = calculateResourceLimits(state)

  const buildingProduction = calculateProduction(state)
  const jobProduction = calculateJobProduction(state)
  const production: Record<string, number> = { ...buildingProduction }
  for (const [resourceId, amount] of Object.entries(jobProduction)) {
    production[resourceId] = (production[resourceId] || 0) + amount
  }

  let newResourceCounts: Record<string, number> = { ...state.resourceCounts }
  for (const [resourceId, amount] of Object.entries(production)) {
    newResourceCounts[resourceId] = (newResourceCounts[resourceId] || 0) + amount
  }

  newResourceCounts = toggleableBuildingConversions(state, newResourceCounts)

  const populationUpdate = applyPopulationGrowth(state, newResourceCounts, nextPopulationCap)

  const nextLeaderDogId = (state.leaderDogId && populationUpdate.dogs.some((dog) => dog.id === state.leaderDogId))
    ? state.leaderDogId
    : null
  for (const [resourceId, amount] of Object.entries(newResourceCounts)) {
    newResourceCounts[resourceId] = min(amount, nextLimits[resourceId] || 0)
  }

  // tick 的时候，先计算资源生产和消耗，再计算人口和资源的相互影响，再应用资源上限。
  // 这样玩家在这一 tick 内获得的资源可以被这一 tick 内增加的人口消耗掉。

  const events: GameEvent[] = []
  populationUpdate.lostDogs.forEach((dog) => {
    events.push({ type: 'death', dogId: dog.id, dogName: dog.name })
  })

  const dogsWithExperience = applyDogExperience(populationUpdate.dogs)

  const gameState: GameState = {
    ...state,
    resourceCounts: newResourceCounts,
    dogs: dogsWithExperience,
    populationCap: nextPopulationCap,
    populationGrowthProgress: populationUpdate.growthProgress,
    tickCount: state.tickCount + 1,
    lastTickTime: Date.now(),
    leaderDogId: nextLeaderDogId,
  }

  return { gameState, events }
}

export interface OfflineProgressResult {
  gameState: GameState
  events: GameEvent[]
  elapsedMs: number
  simulatedTicks: number
  capped: boolean
}

export function applyOfflineProgress(
  state: GameState,
  now: number = Date.now(),
): OfflineProgressResult {
  const elapsedMs = Math.max(0, now - (state.lastTickTime || now))
  const possibleTicks = Math.floor(elapsedMs / GAME_TICK_INTERVAL_MS)
  const simulatedTicks = Math.min(possibleTicks, OFFLINE_PROGRESS_MAX_TICKS)
  const events: GameEvent[] = []

  let nextState = state
  for (let i = 0; i < simulatedTicks; i += 1) {
    const result = tick(nextState)
    nextState = result.gameState
    events.push(...result.events)
  }

  return {
    gameState: {
      ...nextState,
      lastTickTime: now,
    },
    events,
    elapsedMs,
    simulatedTicks,
    capped: possibleTicks > simulatedTicks,
  }
}
