import { describe, it, expect, beforeEach } from 'vitest'
import { buildBuilding, clickResource, setJobAssignment } from './actions'
import { type GameState, createInitialGameState } from './types'

describe('Actions', () => {
  let gameState: GameState

  beforeEach(() => {
    gameState = createInitialGameState()
  })

  describe('Building', () => {
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

  describe('Clicking Resources', () => {
    it('should increase resource count when clicking', () => {
      const newState = clickResource(gameState, 'bones', 3)
      expect(newState.resourceCounts.bones).toBe(3)
    })

    it('should default to increasing by 1 if amount is not specified', () => {
      const newState = clickResource(gameState, 'bones')
      expect(newState.resourceCounts.bones).toBe(1)
    })

    it('should not exceed resource limits when clicking', () => {
      gameState.resourceLimits.bones = 5
      const newState = clickResource(gameState, 'bones', 10)
      expect(newState.resourceCounts.bones).toBe(5)
    })
  })

  describe('Job Assignment', () => {
    it('should set job assignment when population is enough', () => {
      gameState.resourceCounts.puppies = 3
      const newState = setJobAssignment(gameState, 'farmer', 2)
      expect(newState.jobAssignments.farmer).toBe(2)
    })

    it('should reject assignment when total workers exceed population', () => {
      gameState.resourceCounts.puppies = 2
      gameState.jobAssignments.farmer = 1
      expect(() => setJobAssignment(gameState, 'hunter', 2)).toThrow('职业分配总人数不能超过当前人口')
    })

    it('should reject unknown jobs', () => {
      expect(() => setJobAssignment(gameState, 'unknown', 1)).toThrow('职业 unknown 不存在')
    })

    it('should reject negative assignment count', () => {
      expect(() => setJobAssignment(gameState, 'farmer', -1)).toThrow('职业分配数量必须是非负整数')
    })
  })
})
