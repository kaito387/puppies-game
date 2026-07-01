import { describe, it, expect } from 'vitest'

import {
  createInitialGameState,
  createInitialResourceLimits,
  createInitialResourceDeltaPerTick,
} from '@/engine/initialState'

import { RESOURCES, BUILDINGS } from '@/engine/types'

import {
  INITIAL_DOG_COUNT,
  INITIAL_FOOD,
  INITIAL_POPULATION_CAP,
  INITIAL_RESOURCE_LIMITS,
} from '@/engine/constants'

describe('initialState', () => {
  describe('createInitialGameState', () => {
    it('should create game state with all required properties', () => {
      const state = createInitialGameState()

      expect(state).toHaveProperty('resourceCounts')
      expect(state).toHaveProperty('buildings')
      expect(state).toHaveProperty('researchedTechIds')
      expect(state).toHaveProperty('workshopUnlockIds')
      expect(state).toHaveProperty('dogs')
      expect(state).toHaveProperty('populationCap')
      expect(state).toHaveProperty('isDomesticateEnabled')
      expect(state).toHaveProperty('populationGrowthProgress')
      expect(state).toHaveProperty('tickCount')
      expect(state).toHaveProperty('lastTickTime')
      expect(state).toHaveProperty('leaderDogId')
    })

    it('should initialize researchedTechIds as empty array', () => {
      const state = createInitialGameState()
      expect(state.researchedTechIds).toEqual([])
    })

    it('should initialize workshopUnlockIds as empty array', () => {
      const state = createInitialGameState()
      expect(state.workshopUnlockIds).toEqual([])
    })

    it('should initialize with the starting dog count', () => {
      const state = createInitialGameState()
      expect(state.dogs).toHaveLength(INITIAL_DOG_COUNT)
    })

    it('should set populationCap to INITIAL_POPULATION_CAP', () => {
      const state = createInitialGameState()
      expect(state.populationCap).toBe(INITIAL_POPULATION_CAP)
    })

    it('should set isDomesticateEnabled to false', () => {
      const state = createInitialGameState()
      expect(state.isDomesticateEnabled).toBe(false)
    })

    it('should set populationGrowthProgress to 0', () => {
      const state = createInitialGameState()
      expect(state.populationGrowthProgress).toBe(0)
    })

    it('should set tickCount to 0', () => {
      const state = createInitialGameState()
      expect(state.tickCount).toBe(0)
    })

    it('should set leaderDogId to null', () => {
      const state = createInitialGameState()
      expect(state.leaderDogId).toBeNull()
    })

    it('should have valid lastTickTime', () => {
      const state = createInitialGameState()
      expect(typeof state.lastTickTime).toBe('number')
    })

    it('should initialize resources with starting supplies', () => {
      const state = createInitialGameState()
      RESOURCES.forEach((resource) => {
        const expected = resource.id === 'food' ? INITIAL_FOOD : 0
        expect(state.resourceCounts[resource.id]).toBe(expected)
      })
    })

    it('should initialize all buildings to 0', () => {
      const state = createInitialGameState()
      BUILDINGS.forEach((building) => {
        expect(state.buildings[building.id]).toBe(0)
      })
    })
  })

  describe('createInitialResourceLimits', () => {
    it('should return a clone of INITIAL_RESOURCE_LIMITS', () => {
      const limits = createInitialResourceLimits()
      expect(limits).toEqual(INITIAL_RESOURCE_LIMITS)
    })

    it('should return a new object reference each time', () => {
      const limits1 = createInitialResourceLimits()
      const limits2 = createInitialResourceLimits()
      expect(limits1).not.toBe(limits2)
    })
  })

  describe('createInitialResourceDeltaPerTick', () => {
    it('should initialize all resource deltas to 0', () => {
      const deltas = createInitialResourceDeltaPerTick()
      RESOURCES.forEach((resource) => {
        expect(deltas[resource.id]).toBe(0)
      })
    })

    it('should have the same number of entries as RESOURCES', () => {
      const deltas = createInitialResourceDeltaPerTick()
      expect(Object.keys(deltas).length).toBe(RESOURCES.length)
    })
  })
})
