import { describe, it, expect, beforeEach } from 'vitest'
import {
  tick,
  calculateProduction,
  calculateJobProduction,
  calculatePopulationCap,
  calculateResourceLimits,
} from './gameLoop'
import { type GameState, createInitialGameState } from './types'

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
      expect(calculatePopulationCap(gameState)).toBe(7)
    })

    it('should calculate resource limits with warehouse bonuses', () => {
      gameState.buildings.warehouse = 2
      const limits = calculateResourceLimits(gameState)
      expect(limits.food).toBe(500)
      expect(limits.bones).toBe(500)
      expect(limits.puppies).toBe(1)
    })
  })

  describe('Tick', () => {
    it('should produce resources on tick', () => {
      gameState.buildings.farm = 1
      const newState = tick(gameState)
      expect(newState.resourceCounts.puppies).toBe(1)
      expect(newState.resourceCounts.food).toBeCloseTo(0)
      expect(newState.tickCount).toBe(1)
    })

    it('should not exceed resource limits on tick', () => {
      gameState.resourceCounts.food = 98
      gameState.buildings.farm = 20
      const newState = tick(gameState)
      expect(newState.resourceCounts.food).toBeCloseTo(100)
    })

    it('should increase population when there is enough food and space', () => {
      gameState.resourceCounts.food = 200
      gameState.buildings.barn = 5

      let next = gameState
      for (let i = 0; i < 60; i += 1) {
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
      expect(next.resourceCounts.food).toBeCloseTo(50 + 2 - 0.8)
      expect(next.resourceCounts.bones).toBeCloseTo(0.08)
    })
  })
})
