import { describe, it, expect, beforeEach } from 'vitest'
import {
  tick,
  calculateProduction,
  calculateJobProduction,
  calculatePopulationCap,
  calculateResourceLimits,
} from '@/engine/gameLoop'
import { type GameState } from '@/engine/types'
import { createInitialGameState } from '@/engine/initialState'
import {
  FOOD_CONSUMPTION_PER_PUPPY_PER_TICK,
  INITIAL_RESOURCE_LIMITS,
  POPULATION_GROWTH_RATE,
} from '@/engine/constants'
import { createDogs } from '@/engine/dogs'

describe('Game Loop', () => {
  let gameState: GameState

  beforeEach(() => {
    gameState = createInitialGameState()
  })

  function setDogs(count: number) {
    gameState.dogs = createDogs(count)
  }

  describe('Production', () => {
    it('should calculate production correctly with no buildings', () => {
      const production = calculateProduction(gameState)
      expect(production).toEqual({ coal: 0, culture: 0, food: 0, gold: 0, iron: 0, wood: 0, stone: 0, science: 0 })
    })

    it('should calculate production correctly with multiple buildings', () => {
      gameState.buildings.barn = 2
      gameState.buildings.farm = 3
      const production = calculateProduction(gameState)
      expect(production.food).toBeCloseTo(0.6)
      expect(production.wood).toBe(0)
      expect(production.science).toBe(0)
    })

    it('should calculate job production correctly', () => {
      setDogs(3)
      gameState.dogs[0].currentJobId = 'farmer'
      gameState.dogs[0].status = 'working'
      gameState.dogs[0].talentJobId = 'scientist'
      gameState.dogs[1].currentJobId = 'farmer'
      gameState.dogs[1].status = 'working'
      gameState.dogs[1].talentJobId = 'scientist'
      gameState.dogs[2].currentJobId = 'lumberjack'
      gameState.dogs[2].status = 'working'
      gameState.dogs[2].talentJobId = 'scientist'

      const production = calculateJobProduction(gameState)
      expect(production.food).toBeCloseTo(3)
      expect(production.wood).toBeCloseTo(0.2)
    })

    it('should calculate population cap from housing buildings', () => {
      gameState.buildings.barn = 3
      expect(calculatePopulationCap(gameState)).toBe(7)
    })

    it('should calculate resource limits with warehouse bonuses', () => {
      gameState.buildings.warehouse = 2
      const limits = calculateResourceLimits(gameState)
      expect(limits.food).toBe(INITIAL_RESOURCE_LIMITS.food + 2 * 5000)
      expect(limits.wood).toBe(INITIAL_RESOURCE_LIMITS.wood + 2 * 1000)
    })

    it('should apply researched tech multiplier to building production', () => {
      gameState.researchedTechIds = ['woodworking', 'crop_rotation']
      gameState.buildings.farm = 2

      const production = calculateProduction(gameState)
      expect(production.food).toBeCloseTo(0.48)
    })

    it('should keep resource limits unchanged when no resource-limit tech exists', () => {
      gameState.researchedTechIds = ['woodworking', 'crop_rotation']

      const limits = calculateResourceLimits(gameState)
      expect(limits.food).toBe(INITIAL_RESOURCE_LIMITS.food)
      expect(limits.wood).toBe(INITIAL_RESOURCE_LIMITS.wood)
      expect(limits.science).toBeUndefined()
    })

    it('should apply researched tech multiplier to job production', () => {
      gameState.researchedTechIds = ['woodworking']
      setDogs(2)
      gameState.dogs[0].currentJobId = 'lumberjack'
      gameState.dogs[0].status = 'working'
      gameState.dogs[0].talentJobId = 'farmer'

      const production = calculateJobProduction(gameState)
      expect(production.wood).toBeCloseTo(0.24)
    })

    it('should include dog experience bonus in job production with cap', () => {
      setDogs(1)
      gameState.dogs[0].currentJobId = 'farmer'
      gameState.dogs[0].status = 'working'
      gameState.dogs[0].talentJobId = 'scientist'
      gameState.dogs[0].experienceByJob.farmer = 200

      const production = calculateJobProduction(gameState)
      expect(production.food).toBeCloseTo(1.6591, 3)
    })
  })

  describe('Tick', () => {
    it('should produce resources on tick', () => {
      gameState.buildings.farm = 1
      const { gameState: newState } = tick(gameState)
      expect(newState.resourceCounts.food).toBeCloseTo(0.2)
      expect(newState.tickCount).toBe(1)
    })

    it('should not exceed resource limits on tick', () => {
      gameState.buildings.warehouse = 2
      gameState.resourceCounts.food = 19999
      gameState.buildings.farm = 20
      const limits = calculateResourceLimits(gameState)
      const { gameState: newState } = tick(gameState)
      expect(newState.resourceCounts.food).toBeCloseTo(limits.food)
    })

    it('should increase population when domestication is enabled and food is enough', () => {
      gameState.buildings.barn = 5
      gameState.buildings.warehouse = 10
      gameState.resourceCounts.food = 5000
      gameState.isDomesticateEnabled = true

      let next = gameState
      for (let i = 0; i < 200; i += 1) {
        const result = tick(next)
        next = result.gameState
      }

      expect(next.dogs.length).toBeGreaterThan(0)
      expect(next.dogs.length).toBeLessThanOrEqual(next.populationCap)
    })

    it('should apply job production during tick', () => {
      gameState.resourceCounts.food = 50
      setDogs(4)
      gameState.populationCap = 10
      gameState.dogs[0].currentJobId = 'farmer'
      gameState.dogs[1].currentJobId = 'farmer'
      gameState.dogs[2].currentJobId = 'lumberjack'
      gameState.dogs[0].status = 'working'
      gameState.dogs[1].status = 'working'
      gameState.dogs[2].status = 'working'
      gameState.dogs[0].talentJobId = 'scientist'
      gameState.dogs[1].talentJobId = 'scientist'

      const { gameState: next } = tick(gameState)
      expect(next.resourceCounts.food).toBeCloseTo(50 + 3 - 4 * FOOD_CONSUMPTION_PER_PUPPY_PER_TICK)
      expect(next.resourceCounts.wood).toBeCloseTo(0.2)
    })

    it('should not increase growth when domestication is enabled but food is not enough for domestication cost', () => {
      setDogs(0)
      gameState.resourceCounts.food = FOOD_CONSUMPTION_PER_PUPPY_PER_TICK - 0.1
      gameState.isDomesticateEnabled = true

      const { gameState: next } = tick(gameState)
      expect(next.populationGrowthProgress).toBe(0)
      expect(next.resourceCounts.food).toBeCloseTo(FOOD_CONSUMPTION_PER_PUPPY_PER_TICK - 0.1)
    })

    it('should keep growth unchanged when domestication is disabled and there is no deficit', () => {
      setDogs(0)
      gameState.resourceCounts.food = 100
      gameState.populationGrowthProgress = 0.4
      gameState.isDomesticateEnabled = false

      const { gameState: next } = tick(gameState)
      expect(next.populationGrowthProgress).toBeCloseTo(0.4)
      expect(next.dogs.length).toBe(0)
    })

    it('should reset positive progress and accumulate starvation when food deficit exists', () => {
      setDogs(5)
      gameState.resourceCounts.food = 0
      gameState.populationGrowthProgress = 0.6

      const { gameState: next } = tick(gameState)
      const expectedStarvationDelta =
        (5 * FOOD_CONSUMPTION_PER_PUPPY_PER_TICK / FOOD_CONSUMPTION_PER_PUPPY_PER_TICK) *
        POPULATION_GROWTH_RATE

      expect(next.populationGrowthProgress).toBeCloseTo(-expectedStarvationDelta)
      expect(next.resourceCounts.food).toBe(0)
    })

    it('should reduce population after enough starvation progress is accumulated', () => {
      gameState.buildings.barn = 2
      setDogs(5)
      gameState.resourceCounts.food = 0

      let next = gameState
      for (let i = 0; i < 40; i += 1) {
        const result = tick(next)
        next = result.gameState
      }

      expect(next.populationGrowthProgress).toBeLessThan(0)
      expect(next.dogs.length).toBeLessThan(5)
    })

    it('should not spend domestication food when population is at cap', () => {
      gameState.buildings.barn = 1
      setDogs(3)
      gameState.populationCap = 3
      gameState.resourceCounts.food = 200
      gameState.populationGrowthProgress = 0.8
      gameState.isDomesticateEnabled = true

      const { gameState: next } = tick(gameState)
      expect(next.dogs.length).toBe(next.populationCap)
      expect(next.resourceCounts.food).toBeCloseTo(200 - 3 * FOOD_CONSUMPTION_PER_PUPPY_PER_TICK)
      expect(next.populationGrowthProgress).toBeCloseTo(0.8)
    })

    it('should rebalance job assignments after starvation deaths', () => {
      gameState.buildings.barn = 2
      setDogs(5)
      gameState.resourceCounts.food = 0
      gameState.dogs[0].currentJobId = 'farmer'
      gameState.dogs[1].currentJobId = 'farmer'
      gameState.dogs[2].currentJobId = 'farmer'
      gameState.dogs[3].currentJobId = 'lumberjack'
      gameState.dogs[4].currentJobId = 'lumberjack'
      gameState.dogs.forEach((dog) => {
        dog.status = dog.currentJobId ? 'working' : 'idle'
      })

      let next = gameState
      for (let i = 0; i < 10; i += 1) {
        const result = tick(next)
        next = result.gameState
      }

      const totalAssigned = next.dogs.filter((dog) => dog.currentJobId !== null).length
      expect(totalAssigned).toBeLessThanOrEqual(next.dogs.length)
    })

    it('should remove the last dog first when starvation causes deaths', () => {
      setDogs(3)
      gameState.resourceCounts.food = 0
      gameState.populationGrowthProgress = -0.95
      const lastDogId = gameState.dogs[2].id

      const result = tick(gameState)
      const isLastDogStillAlive = result.gameState.dogs.some((dog) => dog.id === lastDogId)
      expect(isLastDogStillAlive).toBe(false)
      expect(result.events[0]?.type).toBe('death')
    })

    it('should increase experience for working dogs after tick', () => {
      setDogs(1)
      gameState.resourceCounts.food = 100
      gameState.dogs[0].currentJobId = 'scientist'
      gameState.dogs[0].status = 'working'

      const before = gameState.dogs[0].experienceByJob.scientist
      const { gameState: next } = tick(gameState)
      expect(next.dogs[0].experienceByJob.scientist).toBeGreaterThan(before)
    })
  })
})
