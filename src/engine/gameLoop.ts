import {
  BUILDINGS,
  JOBS,
  RESOURCES,
  MONTH_TO_SEASON,
  SEASON_EFFECTS,
  type GameState,
  type GameEvent,
  type Season,
  type Calendar,
} from '@/engine/types'
import {
  FOOD_CONSUMPTION_PER_PUPPY_PER_TICK,
  INITIAL_POPULATION_CAP,
  INITIAL_RESOURCE_LIMITS,
  POPULATION_GROWTH_RATE,
  CALENDAR_START_YEAR, 
  CALENDAR_START_MONTH,
  CALENDAR_START_DAY,
  TICKS_PER_DAY, 
  DAYS_PER_MONTH, 
  MONTHS_PER_YEAR,
} from '@/engine/constants'
import { min } from '@/engine/utils'
import { aggregateTechEffects } from '@/engine/technologies'
import {
  calculateDogExperienceGain,
  calculateDogOutputMultiplier,
  createDog,
  normalizeDogStatus,
} from '@/engine/dogs'

export function calculateProduction(gameState: GameState): Record<string, number> {
  const production: Record<string, number> = {}
  const { buildingProductionMultipliers } = aggregateTechEffects(gameState)
  const calendar = calculateCalendarProgress(gameState)
  const seasonEffects = SEASON_EFFECTS[calendar.season] || []

  RESOURCES.forEach((resource) => {
    production[resource.id] = 0
  })

  BUILDINGS.forEach((building) => {
    const count = gameState.buildings[building.id] || 0
    let multiplier = buildingProductionMultipliers[building.id] || 1

    if (building.id === 'farm') {
      seasonEffects.forEach((effect) => {
        if (
          effect.type === 'building_production' &&
          effect.mode === 'multiplier' &&
          effect.targetId === 'farm'
        ) {
          multiplier *= (1 + effect.value)
        }
      })
    }

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
  const { jobProductionMultipliers } = aggregateTechEffects(gameState)
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

    const jobMultiplier = jobProductionMultipliers[job.id] || 1
    const dogMultiplier = calculateDogOutputMultiplier(dog, job.id)

    for (const [resourceId, amount] of Object.entries(job.productionPerTick)) {
      production[resourceId] += amount * jobMultiplier * dogMultiplier
    }
  })

  return production
}

export function calculateCalendarProgress(gameState: GameState): Calendar {
  const totalDays = Math.floor(gameState.tickCount / TICKS_PER_DAY)
  const day = (totalDays + CALENDAR_START_DAY - 1) % DAYS_PER_MONTH + 1
  const monthOffset = Math.floor((totalDays + CALENDAR_START_DAY - 1) / DAYS_PER_MONTH)
  const month = (CALENDAR_START_MONTH + monthOffset - 1) % MONTHS_PER_YEAR + 1
  const year = CALENDAR_START_YEAR + Math.floor((CALENDAR_START_MONTH + monthOffset - 1) / MONTHS_PER_YEAR)
  const season: Season = MONTH_TO_SEASON[month]
  return {
    year: year,
    month: month,
    day: day,
    season: season,
  }
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
  let nextDogs = [...state.dogs]
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

  nextDogs = nextDogs.map((dog) => ({
    ...dog,
    age: dog.age + 1,
  }))

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

    const gainedExperience = calculateDogExperienceGain(dog, dog.currentJobId)
    return {
      ...dog,
      status: normalizeDogStatus(dog.currentJobId),
      experienceByJob: {
        ...dog.experienceByJob,
        [dog.currentJobId]: (dog.experienceByJob[dog.currentJobId] || 0) + gainedExperience,
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

  const newResourceCounts: Record<string, number> = { ...state.resourceCounts }
  for (const [resourceId, amount] of Object.entries(production)) {
    newResourceCounts[resourceId] = (newResourceCounts[resourceId] || 0) + amount
  }

  const populationUpdate = applyPopulationGrowth(state, newResourceCounts, nextPopulationCap)

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
  }

  return { gameState, events }
}
