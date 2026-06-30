import {
  INITIAL_DOG_COUNT,
  INITIAL_FOOD,
  INITIAL_POPULATION_CAP,
  INITIAL_RESOURCE_LIMITS,
} from '@/engine/constants'
import { createDogs } from '@/engine/dogs'
import { BUILDINGS, RESOURCES, type GameState } from '@/engine/types'

export function createInitialResourceLimits(): Record<string, number> {
  return structuredClone(INITIAL_RESOURCE_LIMITS)
}

export function createInitialResourceDeltaPerTick(): Record<string, number> {
  const deltas: Record<string, number> = {}
  RESOURCES.forEach((resource) => {
    deltas[resource.id] = 0
  })

  return deltas
}

export function createInitialGameState(): GameState {
  const resources: Record<string, number> = {}
  RESOURCES.forEach((resource) => {
    resources[resource.id] = 0
  })
  resources.food = INITIAL_FOOD

  const buildings: Record<string, number> = {}
  BUILDINGS.forEach((building) => {
    buildings[building.id] = 0
  })

  const buildingActiveCounts: Record<string, number> = {}
  BUILDINGS.forEach((building) => {
    // only initialize active count for toggleable buildings, others will be treated as always active
    if (building.isToggleable) {
      buildingActiveCounts[building.id] = 0
    }
  })

  return {
    resourceCounts: resources,
    buildings,
    buildingActiveCounts,
    researchedTechIds: [],
    enactedPolicyIds: [],
    workshopUnlockIds: [],
    dogs: createDogs(INITIAL_DOG_COUNT),
    populationCap: INITIAL_POPULATION_CAP,
    leaderDogId: null,
    isDomesticateEnabled: false,
    populationGrowthProgress: 0,
    tickCount: 0,
    lastTickTime: Date.now(),
  }
}
