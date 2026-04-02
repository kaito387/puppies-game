import { describe, it, expect, beforeEach } from 'vitest'
import {
  tick,
  calculateProduction,
  calculateJobProduction,
  calculatePopulationCap,
  calculateResourceLimits,
} from '@/engine/gameLoop'
import {
  FOOD_CONSUMPTION_PER_PUPPY_PER_TICK,
  POPULATION_GROWTH_RATE,
  type GameState,
  createInitialGameState,
} from '@/engine/types'

describe('Game Loop', () => {
  let gameState: GameState

  beforeEach(() => {
    gameState = createInitialGameState()
  })

  describe('Production', () => {
    it('should calculate production correctly with no buildings', () => {
      const production = calculateProduction(gameState)
      expect(production).toEqual({ food: 0, bones: 0 })
    })

    it('should calculate production correctly with multiple buildings', () => {
      gameState.buildings.barn = 2
      gameState.buildings.farm = 3
      const production = calculateProduction(gameState)
      expect(production.food).toBeCloseTo(0.6)
      expect(production.bones).toBe(0)
    })

    it('should calculate job production correctly', () => {
      gameState.population = 3
      gameState.jobAssignments.farmer = 2
      gameState.jobAssignments.hunter = 1
      const production = calculateJobProduction(gameState)
      expect(production.food).toBeCloseTo(3)
      expect(production.bones).toBeCloseTo(0.2)
    })

    it('should calculate population cap from housing buildings', () => {
      gameState.buildings.barn = 3
      expect(calculatePopulationCap(gameState)).toBe(7)
    })

    it('should calculate resource limits with warehouse bonuses', () => {
      gameState.buildings.warehouse = 2
      const limits = calculateResourceLimits(gameState)
      expect(limits.food).toBe(15000)
      expect(limits.bones).toBe(900)
    })
  })

  describe('Tick', () => {
    it('should produce resources on tick', () => {
      gameState.buildings.farm = 1
      const newState = tick(gameState)
      expect(newState.resourceCounts.food).toBeCloseTo(0.2)
      expect(newState.tickCount).toBe(1)
    })

    it('should not exceed resource limits on tick', () => {
      gameState.resourceCounts.food = 4999
      gameState.buildings.farm = 20
      const newState = tick(gameState)
      expect(newState.resourceCounts.food).toBeCloseTo(5000)
      expect(newState.resourceDeltaPerTick.food).toBeCloseTo(1)
    })

    it('should increase population when domestication is enabled and food is enough', () => {
      gameState.buildings.barn = 5
      gameState.buildings.warehouse = 10
      gameState.resourceCounts.food = 5000
      gameState.isDomesticateEnabled = true

      let next = gameState
      for (let i = 0; i < 200; i += 1) {
        next = tick(next)
      }

      expect(next.population).toBeGreaterThan(0)
      expect(next.population).toBeLessThanOrEqual(next.populationCap)
    })

    it('should apply job production during tick', () => {
      gameState.resourceCounts.food = 50
      gameState.population = 4
      gameState.populationCap = 10
      gameState.jobAssignments.farmer = 2
      gameState.jobAssignments.hunter = 1

      const next = tick(gameState)
      expect(next.resourceCounts.food).toBeCloseTo(50 + 3 - 4 * FOOD_CONSUMPTION_PER_PUPPY_PER_TICK)
      expect(next.resourceCounts.bones).toBeCloseTo(0.2)
      expect(next.resourceDeltaPerTick.food).toBeCloseTo(3 - 4 * FOOD_CONSUMPTION_PER_PUPPY_PER_TICK)
      expect(next.resourceDeltaPerTick.bones).toBeCloseTo(0.2)
    })

    it('should not increase growth when domestication is enabled but food is not enough for domestication cost', () => {
      gameState.population = 0
      gameState.resourceCounts.food = FOOD_CONSUMPTION_PER_PUPPY_PER_TICK - 0.1
      gameState.isDomesticateEnabled = true

      const next = tick(gameState)
      expect(next.populationGrowthProgress).toBe(0)
      expect(next.resourceCounts.food).toBeCloseTo(FOOD_CONSUMPTION_PER_PUPPY_PER_TICK - 0.1)
    })

    it('should keep growth unchanged when domestication is disabled and there is no deficit', () => {
      gameState.population = 0
      gameState.resourceCounts.food = 100
      gameState.populationGrowthProgress = 0.4
      gameState.isDomesticateEnabled = false

      const next = tick(gameState)
      expect(next.populationGrowthProgress).toBeCloseTo(0.4)
      expect(next.population).toBe(0)
    })

    it('should reset positive progress and accumulate starvation when food deficit exists', () => {
      gameState.population = 5
      gameState.resourceCounts.food = 0
      gameState.populationGrowthProgress = 0.6

      const next = tick(gameState)
      const expectedStarvationDelta =
        (5 * FOOD_CONSUMPTION_PER_PUPPY_PER_TICK / FOOD_CONSUMPTION_PER_PUPPY_PER_TICK) *
        POPULATION_GROWTH_RATE

      expect(next.populationGrowthProgress).toBeCloseTo(-expectedStarvationDelta)
      expect(next.resourceCounts.food).toBe(0)
    })

    it('should reduce population after enough starvation progress is accumulated', () => {
      gameState.buildings.barn = 2
      gameState.population = 5
      gameState.resourceCounts.food = 0

      let next = gameState
      for (let i = 0; i < 40; i += 1) {
        next = tick(next)
      }

      expect(next.populationGrowthProgress).toBeLessThan(0)
      expect(next.population).toBeLessThan(5)
    })

    it('should not spend domestication food when population is at cap', () => {
      gameState.buildings.barn = 1
      gameState.population = 3
      gameState.populationCap = 3
      gameState.resourceCounts.food = 200
      gameState.populationGrowthProgress = 0.8
      gameState.isDomesticateEnabled = true

      const next = tick(gameState)
      expect(next.population).toBe(next.populationCap)
      expect(next.resourceCounts.food).toBeCloseTo(200 - 3 * FOOD_CONSUMPTION_PER_PUPPY_PER_TICK)
      expect(next.populationGrowthProgress).toBeCloseTo(0.8)
    })

    it('should rebalance job assignments after starvation deaths', () => {
      gameState.buildings.barn = 2
      gameState.population = 5
      gameState.resourceCounts.food = 0
      gameState.jobAssignments.farmer = 3
      gameState.jobAssignments.hunter = 2

      let next = gameState
      for (let i = 0; i < 10; i += 1) {
        next = tick(next)
      }

      const totalAssigned = Object.values(next.jobAssignments).reduce((sum, count) => sum + count, 0)
      expect(totalAssigned).toBeLessThanOrEqual(Math.floor(next.population))
    })
  })
})
