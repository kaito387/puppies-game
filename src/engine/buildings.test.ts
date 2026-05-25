import { describe, it, expect, beforeEach } from 'vitest'
import { buildBuilding, canBuildBuilding, getBuildingCost, getBuildingById, setBuildingActiveCount } from '@/engine/buildings'
import { BUILDINGS, type GameState } from '@/engine/types'
import { createInitialGameState } from '@/engine/initialState'

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

  describe('getBuildingById', () => {
    it('should throw when building id does not exist', () => {
      expect(() => getBuildingById('nonexistent')).toThrow('建筑 nonexistent 不存在')
    })

    it('should return the correct building when id exists', () => {
      const building = getBuildingById('barn')
      expect(building.id).toBe('barn')
    })
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

  describe('Prerequisites', () => {
    it('should return false for canBuildBuilding when tech prerequisites are not met', () => {
      gameState.resourceCounts.wood = 1000
      expect(canBuildBuilding(gameState, 'workshop')).toBe(false)
    })

    it('should return true for canBuildBuilding once tech prerequisites are met', () => {
      gameState.resourceCounts.wood = 1000
      gameState.researchedTechIds = ['workshop_engineering']
      expect(canBuildBuilding(gameState, 'workshop')).toBe(true)
    })

    it('should throw when building prerequisites are not met in buildBuilding', () => {
      gameState.resourceCounts.wood = 1000
      expect(() => buildBuilding(gameState, 'workshop')).toThrow('尚未解锁')
    })
  })

  describe('setBuildingActiveCount', () => {
    it('should set activeCount within bounds', () => {
      gameState.buildings.smelter = 3
      gameState.buildingActiveCounts.smelter = 0

      const next = setBuildingActiveCount(gameState, 'smelter', 2)
      expect(next.buildingActiveCounts.smelter).toBe(2)
    })

    it('should clamp activeCount to ownedCount when count exceeds owned', () => {
      gameState.buildings.smelter = 2
      gameState.buildingActiveCounts.smelter = 0

      const next = setBuildingActiveCount(gameState, 'smelter', 10)
      expect(next.buildingActiveCounts.smelter).toBe(2)
    })

    it('should clamp activeCount to 0 when count is negative', () => {
      gameState.buildings.smelter = 3
      gameState.buildingActiveCounts.smelter = 2

      const next = setBuildingActiveCount(gameState, 'smelter', -5)
      expect(next.buildingActiveCounts.smelter).toBe(0)
    })

    it('should not affect non-toggleable buildings', () => {
      gameState.buildings.barn = 3

      const next = setBuildingActiveCount(gameState, 'barn', 3)
      expect(next).toBe(gameState)
    })

    it('should not mutate original state', () => {
      gameState.buildings.smelter = 2
      gameState.buildingActiveCounts.smelter = 0

      setBuildingActiveCount(gameState, 'smelter', 2)
      expect(gameState.buildingActiveCounts.smelter).toBe(0)
    })
  })
})