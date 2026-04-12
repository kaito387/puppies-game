import { describe, it, expect, beforeEach } from 'vitest'
import { buildBuilding, canBuildBuilding, getBuildingCost } from '@/engine/buildings'
import { BUILDINGS, type GameState } from '@/engine/types'
import { createInitialGameState } from '@/engine/initialState'

// NOTE 这里的测试都不是硬编码，依赖计算逻辑本身
// 主要是为了适应开发阶段频繁调整建筑数值的情况，避免每次调整都要修改测试数据
// 后期可以考虑增加一些硬编码数值的测试用例，来验证核心数值的正确性和稳定性

describe('Buildings', () => {
  let gameState: GameState
  const barn = BUILDINGS.find((building) => building.id === 'barn')!
  const farm = BUILDINGS.find((building) => building.id === 'farm')!

  const calculateExpectedCost = (
    baseCost: Record<string, number>,
    costGrowthMultiplier: number,
    ownedCount: number,
  ): Record<string, number> => {
    const expected: Record<string, number> = {}
    for (const [resourceId, amount] of Object.entries(baseCost)) {
      expected[resourceId] = Math.ceil(amount * costGrowthMultiplier ** ownedCount)
    }
    return expected
  }

  beforeEach(() => {
    gameState = createInitialGameState()
  })

  describe('Cost Scaling', () => {
    it('should calculate building cost from the current building count', () => {
      expect(getBuildingCost(gameState, 'barn')).toEqual(
        calculateExpectedCost(barn.cost, barn.costGrowthMultiplier, 0),
      )

      gameState.buildings.barn = 1
      expect(getBuildingCost(gameState, 'barn')).toEqual(
        calculateExpectedCost(barn.cost, barn.costGrowthMultiplier, 1),
      )
    })

    it('should round building costs up after growth', () => {
      gameState.buildings.farm = 2
      expect(getBuildingCost(gameState, 'farm')).toEqual(
        calculateExpectedCost(farm.cost, farm.costGrowthMultiplier, 2),
      )
    })

    it('should report whether a building can be built with dynamic cost', () => {
      gameState.resourceCounts.wood = barn.cost.wood || 0
      gameState.resourceCounts.food = barn.cost.food || 0
      expect(canBuildBuilding(gameState, 'barn')).toBe(true)

      gameState.buildings.barn = 1
      expect(canBuildBuilding(gameState, 'barn')).toBe(false)
    })

    it('should apply technology cost discount to building costs', () => {
      gameState.researchedTechIds = ['woodworking', 'crop_rotation']
      expect(getBuildingCost(gameState, 'farm').food).toBe(8)
    })

    it('should build a barn if resources are sufficient', () => {
      gameState.resourceCounts.wood = barn.cost.wood || 0
      gameState.resourceCounts.food = barn.cost.food || 0
      const newState = buildBuilding(gameState, 'barn')
      expect(newState.buildings.barn).toBe(1)
      expect(newState.resourceCounts.wood).toBe(0)
      expect(newState.resourceCounts.food).toBe(0)
    })

    it('should not build a barn if resources are insufficient', () => {
      gameState.resourceCounts.wood = 5
      expect(() => buildBuilding(gameState, 'barn')).toThrow('资源 wood 不足')
    })

    it('should throw an error if building does not exist', () => {
      expect(() => buildBuilding(gameState, 'nonexistent')).toThrow('建筑 nonexistent 不存在')
    })
  })
})