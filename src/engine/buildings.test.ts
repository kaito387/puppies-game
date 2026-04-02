import { describe, it, expect, beforeEach } from 'vitest'
import { buildBuilding, canBuildBuilding, getBuildingCost } from '@/engine/buildings'
import { BUILDINGS, type GameState, createInitialGameState } from '@/engine/types'

// NOTE 这里的测试都不是硬编码，依赖计算逻辑本身
// 主要是为了适应开发阶段频繁调整建筑数值的情况，避免每次调整都要修改测试数据
// 后期可以考虑增加一些硬编码数值的测试用例，来验证核心数值的正确性和稳定性

describe('Buildings', () => {
  let gameState: GameState
  const barn = BUILDINGS.find((building) => building.id === 'barn')!
  const farm = BUILDINGS.find((building) => building.id === 'farm')!

  beforeEach(() => {
    gameState = createInitialGameState()
  })

  describe('Cost Scaling', () => {
    it('should calculate building cost from the current building count', () => {
      expect(getBuildingCost(gameState, 'barn')).toEqual({ bones: 20 })

      gameState.buildings.barn = 1
      const expected = Math.ceil((barn.cost.bones || 0) * barn.costGrowthMultiplier ** 1)
      expect(getBuildingCost(gameState, 'barn')).toEqual({ bones: expected })
    })

    it('should round building costs up after growth', () => {
      gameState.buildings.farm = 2
      const expected = Math.ceil((farm.cost.bones || 0) * farm.costGrowthMultiplier ** 2)
      expect(getBuildingCost(gameState, 'farm')).toEqual({ bones: expected })
    })

    it('should report whether a building can be built with dynamic cost', () => {
      gameState.resourceCounts.bones = 20
      expect(canBuildBuilding(gameState, 'barn')).toBe(true)

      gameState.buildings.barn = 1
      expect(canBuildBuilding(gameState, 'barn')).toBe(false)
    })

    it('should build a barn if resources are sufficient', () => {
      gameState.resourceCounts.bones = 20
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