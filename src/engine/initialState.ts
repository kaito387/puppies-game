import { INITIAL_POPULATION_CAP, INITIAL_RESOURCE_LIMITS } from '@/engine/constants'
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

  const buildings: Record<string, number> = {}
  BUILDINGS.forEach((building) => {
    buildings[building.id] = 0
  })

  return {
    resourceCounts: resources,
    buildings,
    researchedTechIds: [],
    workshopUnlockIds: [],
    dogs: [],
    populationCap: INITIAL_POPULATION_CAP,
    leaderDogId: null,
    isDomesticateEnabled: false,
    populationGrowthProgress: 0,
    tickCount: 0,
    lastTickTime: Date.now(),
  }
}