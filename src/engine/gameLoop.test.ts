import { describe, it, expect, beforeEach } from 'vitest'
import {
  tick,
  calculateProduction,
  calculateJobProduction,
  calculatePopulationCap,
  calculateResourceLimits,
} from '@/engine/gameLoop'
import { type GameState, createInitialGameState } from '@/engine/types'

describe('Game Loop', () => {
  let gameState: GameState

  beforeEach(() => {
    gameState = createInitialGameState()
  })

  describe('Production', () => {
    it('should calculate production correctly with no buildings', () => {
      const production = calculateProduction(gameState)
      expect(production).toEqual({ puppies: 0, food: 0, bones: 0 })
    })

    it('should calculate production correctly with multiple buildings', () => {
      gameState.buildings.barn = 2
      gameState.buildings.farm = 3
      const production = calculateProduction(gameState)
      expect(production.puppies).toBe(0)
      expect(production.food).toBeCloseTo(0.6)
      expect(production.bones).toBe(0)
    })

    it('should calculate job production correctly', () => {
      gameState.resourceCounts.puppies = 3
      gameState.jobAssignments.farmer = 2
      gameState.jobAssignments.hunter = 1
      const production = calculateJobProduction(gameState)
      expect(production.food).toBeCloseTo(2)
      expect(production.bones).toBeCloseTo(0.08)
      expect(production.puppies).toBe(0)
    })

    it('should calculate population cap from housing buildings', () => {
      gameState.buildings.barn = 3
      expect(calculatePopulationCap(gameState)).toBe(6)
    })

    it('should calculate resource limits with warehouse bonuses', () => {
      gameState.buildings.warehouse = 2
      const limits = calculateResourceLimits(gameState)
      expect(limits.food).toBe(1500)
      expect(limits.bones).toBe(1500)
      expect(limits.puppies).toBe(0)
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
      gameState.resourceCounts.food = 498
      gameState.buildings.farm = 20
      const newState = tick(gameState)
      expect(newState.resourceCounts.food).toBeCloseTo(500)
    })

    it('should increase population when there is enough food and space', () => {
      gameState.buildings.barn = 5
      gameState.buildings.warehouse = 10
      gameState.resourceCounts.food = 5000

      let next = gameState
      for (let i = 0; i < 200; i += 1) {
        next = tick(next)
      }

      expect(next.resourceCounts.puppies).toBeGreaterThan(1)
      expect(next.resourceCounts.puppies).toBeLessThanOrEqual(15)
    })

    it('should apply job production during tick', () => {
      gameState.resourceCounts.food = 50
      gameState.resourceCounts.puppies = 4
      gameState.jobAssignments.farmer = 2
      gameState.jobAssignments.hunter = 1

      const next = tick(gameState)
      expect(next.resourceCounts.food).toBeCloseTo(50 + 2 - 4)
      expect(next.resourceCounts.bones).toBeCloseTo(0.08)
    })

    it('should accumulate negative progress and eventually reduce population when starving', () => {
      gameState.buildings.barn = 2
      gameState.resourceCounts.puppies = 5
      gameState.resourceCounts.food = 0

      let next = gameState
      for (let i = 0; i < 40; i += 1) {
        next = tick(next)
      }

      expect(next.populationGrowthProgress).toBeLessThan(0)
      expect(next.resourceCounts.puppies).toBeLessThan(5)
    })

    it('should keep growth and starvation progress mutually exclusive', () => {
      gameState.buildings.barn = 2
      gameState.resourceCounts.puppies = 3
      gameState.populationGrowthProgress = -0.7
      gameState.resourceCounts.food = 200

      const next = tick(gameState)
      expect(next.populationGrowthProgress).toBeGreaterThanOrEqual(0)

      next.resourceCounts.food = 0
      const starving = tick(next)
      expect(starving.populationGrowthProgress).toBeLessThanOrEqual(0)
    })

    it('should reset progress to zero when population is at cap', () => {
      gameState.resourceCounts.food = 200
      gameState.buildings.barn = 1
      gameState.resourceCounts.puppies = 2
      gameState.populationGrowthProgress = 0.8

      const next = tick(gameState)
      expect(next.resourceCounts.puppies).toBe(2)
      expect(next.populationGrowthProgress).toBe(0)
    })

    it('should rebalance job assignments after starvation deaths', () => {
      gameState.buildings.barn = 2
      gameState.resourceCounts.puppies = 5
      gameState.resourceCounts.food = 0
      gameState.jobAssignments.farmer = 3
      gameState.jobAssignments.hunter = 2

      let next = gameState
      for (let i = 0; i < 10; i += 1) {
        next = tick(next)
      }

      const totalAssigned = Object.values(next.jobAssignments).reduce((sum, count) => sum + count, 0)
      expect(totalAssigned).toBeLessThanOrEqual(Math.floor(next.resourceCounts.puppies))
    })
  })
})
