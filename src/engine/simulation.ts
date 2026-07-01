import { buildBuilding, canBuildBuilding, setBuildingActiveCount } from '@/engine/buildings'
import { createInitialGameState } from '@/engine/initialState'
import { enactPolicy } from '@/engine/actions'
import {
  BUILDINGS,
  POLICY_GROUPS,
  RESOURCES,
  TECHNOLOGIES,
  WORKSHOP_UNLOCKS,
  type GameState,
} from '@/engine/types'
import { getVisibleJobsIds, canResearchTechnology, researchTechnology } from '@/engine/technologies'
import { canUnlockWorkshopItem, unlockWorkshopItem } from '@/engine/workshop'
import { setJobAssignment, setDomesticateEnabled } from '@/engine/actions'
import {
  calculateJobProduction,
  calculateProduction,
  calculatePopulationCap,
  calculateResourceLimits,
} from '@/engine/gameLoop'
import {
  DOG_EXPERIENCE_GAIN_PER_TICK,
  DOGPOWER_PER_EXPLORATION,
  FUR_REWARD_MAX,
  FUR_REWARD_MIN,
  FOOD_CONSUMPTION_PER_PUPPY_PER_TICK,
  GAME_TICK_INTERVAL_MS,
  POPULATION_GROWTH_RATE,
  PROBABILITY_GET_FUR_FROM_EXPLORATION,
} from '@/engine/constants'
import { canEnactPolicy } from '@/engine/policies'
import { aggregateEffects } from '@/engine/technologies'
import { createDog, normalizeDogStatus } from '@/engine/dogs'

export interface SimulationOptions {
  days: number
  secondsPerDecision: number
  secondsPerStep?: number
}

export interface SimulationMilestone {
  tick: number
  day: number
  population: number
  buildings: number
  technologies: number
  workshopUnlocks: number
  policies: number
  resources: Record<string, number>
}

export interface SimulationResult {
  finalState: GameState
  milestones: SimulationMilestone[]
  purchases: string[]
  lastPurchaseTick: number
}

const BUILDING_PRIORITY = [
  'farm',
  'barn',
  'warehouse',
  'library',
  'granary',
  'workshop',
  'quarry',
  'kennel',
  'charcoal_kiln',
  'smelter',
  'academy',
  'market',
  'observatory',
  'mint',
  'monument',
]

const TECHNOLOGY_PRIORITY = [
  'workshop_engineering',
  'mining',
  'crop_rotation',
  'woodworking',
  'animal_husbandry',
  'masonry',
  'administration',
  'forestry',
  'logistics',
  'education',
  'metalworking',
  'charcoal_burning',
  'economics',
  'expedition_cartography',
  'calendar',
  'banking',
  'civil_service',
  'astronomy',
]

const WORKSHOP_PRIORITY = [
  'wood_pickaxe',
  'hand_saw',
  'irrigation_channels',
  'stone_pickaxe',
  'exploration_gear',
  'field_pack',
  'iron_pickaxe',
  'survey_compass',
  'printing_press',
  'ledger',
  'steel_tools',
]

const POLICY_PRIORITY = [
  'policy-authoritarian',
  'policy-radical',
  'policy-development',
  'policy-free-market',
  'policy-frontier',
  'policy-scholasticism',
]

const JOB_PRIORITY = [
  'farmer',
  'lumberjack',
  'scientist',
  'miner',
  'hunter',
  'artist',
  'forester',
  'engineer',
  'merchant',
  'prospector',
]

function countBuildings(state: GameState): number {
  return Object.values(state.buildings).reduce((sum, count) => sum + count, 0)
}

function createMilestone(state: GameState, day: number): SimulationMilestone {
  return {
    tick: state.tickCount,
    day,
    population: state.dogs.length,
    buildings: countBuildings(state),
    technologies: state.researchedTechIds.length,
    workshopUnlocks: state.workshopUnlockIds.length,
    policies: state.enactedPolicyIds.length,
    resources: Object.fromEntries(
      Object.entries(state.resourceCounts).map(([resourceId, amount]) => [
        resourceId,
        Math.floor(amount),
      ]),
    ),
  }
}

function buyFirstAvailable(
  state: GameState,
  purchases: string[],
  label: string,
  ids: string[],
  canBuy: (state: GameState, id: string) => boolean,
  buy: (state: GameState, id: string) => GameState,
): GameState {
  for (const id of ids) {
    if (!canBuy(state, id)) {
      continue
    }

    purchases.push(`${label}:${id}@${state.tickCount}`)
    return buy(state, id)
  }

  return state
}

function setAllToggleableBuildingsActive(state: GameState): GameState {
  let nextState = state
  const resourceLimits = calculateResourceLimits(nextState)
  for (const building of BUILDINGS) {
    if (!building.isToggleable) {
      continue
    }

    const owned = nextState.buildings[building.id] || 0
    if (owned > 0) {
      let target = 0
      if (building.id === 'charcoal_kiln') {
        const woodRatio = (nextState.resourceCounts.wood || 0) / Math.max(1, resourceLimits.wood || 1)
        target = woodRatio > 0.65 ? Math.min(owned, 1) : 0
      } else if (building.id === 'smelter') {
        const woodRatio = (nextState.resourceCounts.wood || 0) / Math.max(1, resourceLimits.wood || 1)
        const stoneRatio = (nextState.resourceCounts.stone || 0) / Math.max(1, resourceLimits.stone || 1)
        target = woodRatio > 0.35 && stoneRatio > 0.35 ? Math.min(owned, 2) : 0
      } else if (building.id === 'mint') {
        const ironRatio = (nextState.resourceCounts.iron || 0) / Math.max(1, resourceLimits.iron || 1)
        const coalRatio = (nextState.resourceCounts.coal || 0) / Math.max(1, resourceLimits.coal || 1)
        target = ironRatio > 0.45 && coalRatio > 0.45 ? Math.min(owned, 1) : 0
      } else {
        target = owned
      }

      nextState = setBuildingActiveCount(nextState, building.id, target)
    }
  }

  return nextState
}

function runExplorationForSimulation(state: GameState): GameState {
  let nextState = state
  let resourceLimits = calculateResourceLimits(nextState)
  const averageFurReward =
    ((FUR_REWARD_MIN + FUR_REWARD_MAX) / 2) * PROBABILITY_GET_FUR_FROM_EXPLORATION

  while (
    (nextState.resourceCounts.dogpower || 0) >= DOGPOWER_PER_EXPLORATION &&
    (nextState.resourceCounts.fur || 0) < (resourceLimits.fur || 0)
  ) {
    const currentFur = nextState.resourceCounts.fur || 0
    const furLimit = resourceLimits.fur || 0
    nextState = {
      ...nextState,
      resourceCounts: {
        ...nextState.resourceCounts,
        dogpower: (nextState.resourceCounts.dogpower || 0) - DOGPOWER_PER_EXPLORATION,
        fur: Math.min(furLimit, currentFur + averageFurReward),
      },
    }
    resourceLimits = calculateResourceLimits(nextState)
  }

  return nextState
}

function assignJobsForSimulation(state: GameState): GameState {
  let nextState: GameState = {
    ...state,
    dogs: state.dogs.map((dog) => ({
      ...dog,
      currentJobId: null,
      status: normalizeDogStatus(null),
    })),
  }
  const visibleJobs = getVisibleJobsIds(nextState)
  let remaining = nextState.dogs.length

  for (const jobId of JOB_PRIORITY) {
    if (!visibleJobs.includes(jobId)) {
      continue
    }

    let target = 0
    if (jobId === 'farmer') {
      target = Math.min(remaining, Math.ceil(nextState.dogs.length * 0.25))
    } else if (jobId === 'lumberjack') {
      target = Math.min(remaining, Math.ceil(nextState.dogs.length * 0.2))
    } else if (jobId === 'scientist') {
      target = Math.min(remaining, Math.ceil(nextState.dogs.length * 0.18))
    } else if (jobId === 'miner') {
      target = Math.min(remaining, Math.ceil(nextState.dogs.length * 0.15))
    } else if (jobId === 'hunter') {
      target = Math.min(remaining, Math.ceil(nextState.dogs.length * 0.08))
    } else if (jobId === 'artist') {
      target = Math.min(remaining, Math.ceil(nextState.dogs.length * 0.1))
    } else {
      target = Math.min(remaining, Math.max(1, Math.floor(nextState.dogs.length * 0.08)))
    }

    if (target > 0) {
      nextState = setJobAssignment(nextState, jobId, target)
      remaining -= target
    }
  }

  const fallbackJob = visibleJobs.includes('lumberjack') ? 'lumberjack' : visibleJobs[0]
  if (fallbackJob && remaining > 0) {
    const current = nextState.dogs.filter((dog) => dog.currentJobId === fallbackJob).length
    nextState = setJobAssignment(nextState, fallbackJob, current + remaining)
  }

  return nextState
}

function advanceSimulationTicks(state: GameState, ticksToAdvance: number): GameState {
  if (ticksToAdvance <= 0) {
    return state
  }

  const production: Record<string, number> = {}
  const buildingProduction = calculateProduction(state)
  const jobProduction = calculateJobProduction(state)
  const resourceLimits = calculateResourceLimits(state)
  const populationCap = calculatePopulationCap(state)
  const { buildingProductionMultipliers } = aggregateEffects(state)

  RESOURCES.forEach((resource) => {
    production[resource.id] =
      (buildingProduction[resource.id] || 0) + (jobProduction[resource.id] || 0)
  })

  const nextResourceCounts = { ...state.resourceCounts }
  for (const [resourceId, amount] of Object.entries(production)) {
    nextResourceCounts[resourceId] = (nextResourceCounts[resourceId] || 0) + amount * ticksToAdvance
  }

  for (const building of BUILDINGS) {
    if (!building.isToggleable) {
      continue
    }

    const active = state.buildingActiveCounts[building.id] || 0
    if (active <= 0) {
      continue
    }

    let affordableTicks = ticksToAdvance
    for (const [resourceId, amount] of Object.entries(building.consumptionPerTick || {})) {
      const needPerTick = amount * active
      if (needPerTick > 0) {
        affordableTicks = Math.min(
          affordableTicks,
          Math.floor((nextResourceCounts[resourceId] || 0) / needPerTick),
        )
      }
    }

    if (affordableTicks <= 0) {
      continue
    }

    for (const [resourceId, amount] of Object.entries(building.consumptionPerTick || {})) {
      nextResourceCounts[resourceId] =
        (nextResourceCounts[resourceId] || 0) - amount * active * affordableTicks
    }

    for (const [resourceId, amount] of Object.entries(building.productionPerTick || {})) {
      const multiplier = buildingProductionMultipliers[building.id] || 1
      nextResourceCounts[resourceId] =
        (nextResourceCounts[resourceId] || 0) + amount * active * multiplier * affordableTicks
    }
  }

  const nextDogs = [...state.dogs]
  const foodNeed = nextDogs.length * FOOD_CONSUMPTION_PER_PUPPY_PER_TICK * ticksToAdvance
  const foodBeforePopulation = nextResourceCounts.food || 0
  let nextProgress = state.populationGrowthProgress || 0

  if (foodBeforePopulation >= foodNeed) {
    nextResourceCounts.food = foodBeforePopulation - foodNeed

    if (state.isDomesticateEnabled && nextDogs.length < populationCap) {
      const domesticateTicks = Math.min(
        ticksToAdvance,
        Math.floor((nextResourceCounts.food || 0) / FOOD_CONSUMPTION_PER_PUPPY_PER_TICK),
      )
      nextResourceCounts.food =
        (nextResourceCounts.food || 0) -
        domesticateTicks * FOOD_CONSUMPTION_PER_PUPPY_PER_TICK
      nextProgress = Math.max(0, nextProgress) + domesticateTicks * POPULATION_GROWTH_RATE
    }
  } else {
    const deficit = foodNeed - foodBeforePopulation
    nextResourceCounts.food = 0
    nextProgress = -((deficit / FOOD_CONSUMPTION_PER_PUPPY_PER_TICK) * POPULATION_GROWTH_RATE)
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
    const lostPopulation = Math.min(Math.floor(-nextProgress), nextDogs.length)
    nextDogs.splice(Math.max(0, nextDogs.length - lostPopulation), lostPopulation)
    nextProgress = nextDogs.length <= 0 ? 0 : nextProgress + lostPopulation
  }

  for (const [resourceId, amount] of Object.entries(nextResourceCounts)) {
    nextResourceCounts[resourceId] = Math.min(amount, resourceLimits[resourceId] || 0)
  }

  const nextLeaderDogId =
    state.leaderDogId && nextDogs.some((dog) => dog.id === state.leaderDogId)
      ? state.leaderDogId
      : null

  const dogsWithExperience = nextDogs.map((dog) => {
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
        [dog.currentJobId]:
          (dog.experienceByJob[dog.currentJobId] || 0) +
          DOG_EXPERIENCE_GAIN_PER_TICK * ticksToAdvance,
      },
    }
  })

  return {
    ...state,
    resourceCounts: nextResourceCounts,
    dogs: dogsWithExperience,
    populationCap,
    populationGrowthProgress: nextProgress,
    tickCount: state.tickCount + ticksToAdvance,
    lastTickTime: state.lastTickTime + ticksToAdvance * GAME_TICK_INTERVAL_MS,
    leaderDogId: nextLeaderDogId,
  }
}

function choosePolicyIds(state: GameState): string[] {
  const visibleGroups = POLICY_GROUPS.filter((group) => {
    return group.policyIds.some((policyId) => POLICY_PRIORITY.includes(policyId))
  })

  return visibleGroups
    .map((group) => group.policyIds.find((policyId) => POLICY_PRIORITY.includes(policyId)))
    .filter((policyId): policyId is string => Boolean(policyId))
    .filter((policyId) => canEnactPolicy(state, policyId))
}

function makePurchases(state: GameState, purchases: string[]): GameState {
  let nextState = state

  const availablePolicyIds = choosePolicyIds(nextState)
  nextState = buyFirstAvailable(
    nextState,
    purchases,
    'policy',
    availablePolicyIds,
    canEnactPolicy,
    enactPolicy,
  )

  nextState = buyFirstAvailable(
    nextState,
    purchases,
    'technology',
    TECHNOLOGY_PRIORITY.filter((id) => TECHNOLOGIES.some((technology) => technology.id === id)),
    canResearchTechnology,
    researchTechnology,
  )

  nextState = buyFirstAvailable(
    nextState,
    purchases,
    'workshop',
    WORKSHOP_PRIORITY.filter((id) => WORKSHOP_UNLOCKS.some((unlock) => unlock.id === id)),
    canUnlockWorkshopItem,
    unlockWorkshopItem,
  )

  nextState = buyFirstAvailable(
    nextState,
    purchases,
    'building',
    BUILDING_PRIORITY.filter((id) => BUILDINGS.some((building) => building.id === id)),
    canBuildBuilding,
    buildBuilding,
  )

  return nextState
}

export function runBalanceSimulation(options: SimulationOptions): SimulationResult {
  const totalTicks = Math.floor((options.days * 24 * 60 * 60 * 1000) / GAME_TICK_INTERVAL_MS)
  const stepTicks = Math.max(
    1,
    Math.floor(((options.secondsPerStep ?? 60) * 1000) / GAME_TICK_INTERVAL_MS),
  )
  const decisionIntervalTicks = Math.max(
    1,
    Math.floor((options.secondsPerDecision * 1000) / GAME_TICK_INTERVAL_MS),
  )
  const milestoneIntervalTicks = Math.max(1, Math.floor(totalTicks / options.days))
  const milestones: SimulationMilestone[] = []
  const purchases: string[] = []
  let state = setDomesticateEnabled(createInitialGameState(), true)

  for (let elapsedTicks = 0; elapsedTicks < totalTicks;) {
    if (elapsedTicks % decisionIntervalTicks === 0) {
      state = runExplorationForSimulation(state)
      state = setAllToggleableBuildingsActive(state)
      state = assignJobsForSimulation(state)
      for (let attempts = 0; attempts < 4; attempts += 1) {
        const beforePurchases = purchases.length
        state = makePurchases(state, purchases)
        if (beforePurchases === purchases.length) {
          break
        }
      }
    }

    const ticksThisStep = Math.min(stepTicks, totalTicks - elapsedTicks)
    state = advanceSimulationTicks(state, ticksThisStep)
    elapsedTicks += ticksThisStep

    if (elapsedTicks % milestoneIntervalTicks < stepTicks || elapsedTicks >= totalTicks) {
      const day = Math.min(options.days, Math.ceil(elapsedTicks / milestoneIntervalTicks))
      if (!milestones.some((milestone) => milestone.day === day)) {
        milestones.push(createMilestone(state, day))
      }
    }
  }

  return {
    finalState: state,
    milestones,
    purchases,
    lastPurchaseTick: Number(purchases.at(-1)?.split('@')[1] || 0),
  }
}
