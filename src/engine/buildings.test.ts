import { describe, it, expect, beforeEach } from 'vitest'
import { buildBuilding, canBuildBuilding, getBuildingCost } from '@/engine/buildings'
import { type GameState, createInitialGameState } from '@/engine/types'

describe('Buildings', () => {
  let gameState: GameState

  beforeEach(() => {
    gameState = createInitialGameState()
  })

  describe('Cost Scaling', () => {
    it('should calculate building cost from the current building count', () => {
      expect(getBuildingCost(gameState, 'barn')).toEqual({ bones: 10 })

      gameState.buildings.barn = 1
      expect(getBuildingCost(gameState, 'barn')).toEqual({ bones: 12 })
    })

    it('should round building costs up after growth', () => {
      gameState.buildings.farm = 2
      expect(getBuildingCost(gameState, 'farm')).toEqual({ bones: 26 })
    })

    it('should report whether a building can be built with dynamic cost', () => {
      gameState.resourceCounts.bones = 10
      expect(canBuildBuilding(gameState, 'barn')).toBe(true)

      gameState.buildings.barn = 1
      expect(canBuildBuilding(gameState, 'barn')).toBe(false)
    })

    it('should build a barn if resources are sufficient', () => {
      gameState.resourceCounts.bones = 10
      const newState = buildBuilding(gameState, 'barn')
      expect(newState.buildings.barn).toBe(1)
      expect(newState.resourceCounts.bones).toBe(0)
    })

    it('should not build a barn if resources are insufficient', () => {
      gameState.resourceCounts.bones = 5
      expect(() => buildBuilding(gameState, 'barn')).toThrow('资源 bones 不足')
    })

    it('should throw an error if building does not exist', () => {
      expect(() => buildBuilding(gameState, 'nonexistent')).toThrow('建筑 nonexistent 不存在')
    })
  })
})