import { describe, it, expect, beforeEach } from 'vitest'
import {
  clickResource,
  rebalanceJobAssignments,
  setDomesticateEnabled,
  setJobAssignment,
} from '@/engine/actions'
import { type GameState, createInitialGameState } from '@/engine/types'

describe('Actions', () => {
  let gameState: GameState

  beforeEach(() => {
    gameState = createInitialGameState()
  })

  describe('Clicking Resources', () => {
    it('should increase resource count when clicking', () => {
      const newState = clickResource(gameState, 'wood', 3)
      expect(newState.resourceCounts.wood).toBe(3)
    })

    it('should default to increasing by 1 if amount is not specified', () => {
      const newState = clickResource(gameState, 'wood')
      expect(newState.resourceCounts.wood).toBe(1)
    })

    it('should not exceed resource limits when clicking', () => {
      gameState.resourceLimits.wood = 5
      const newState = clickResource(gameState, 'wood', 10)
      expect(newState.resourceCounts.wood).toBe(5)
    })
  })

  describe('Job Assignment', () => {
    it('should set job assignment when population is enough', () => {
      gameState.population = 3
      const newState = setJobAssignment(gameState, 'farmer', 2)
      expect(newState.jobAssignments.farmer).toBe(2)
    })

    it('should reject assignment when total workers exceed population', () => {
      gameState.population = 2
      gameState.jobAssignments.farmer = 1
      expect(() => setJobAssignment(gameState, 'lumberjack', 2)).toThrow('职业分配总人数不能超过当前人口')
    })

    it('should reject unknown jobs', () => {
      expect(() => setJobAssignment(gameState, 'unknown', 1)).toThrow('职业 unknown 不存在')
    })

    it('should reject negative assignment count', () => {
      expect(() => setJobAssignment(gameState, 'farmer', -1)).toThrow('职业分配数量必须是非负整数')
    })

    it('should keep assignments unchanged when total assigned is within population', () => {
      const nextAssignments = rebalanceJobAssignments({ farmer: 2, lumberjack: 1 }, 4)
      expect(nextAssignments).toEqual({ farmer: 2, lumberjack: 1 })
    })

    it('should reduce assignments from the end of JOBS order first', () => {
      const nextAssignments = rebalanceJobAssignments({ farmer: 2, lumberjack: 2 }, 3)
      expect(nextAssignments).toEqual({ farmer: 2, lumberjack: 1 })
    })

    it('should cascade assignment reduction when deaths exceed idle population', () => {
      const nextAssignments = rebalanceJobAssignments({ farmer: 4, lumberjack: 3 }, 2)
      expect(nextAssignments).toEqual({ farmer: 2, lumberjack: 0 })
    })

    it('should toggle domestication switch state', () => {
      const enabledState = setDomesticateEnabled(gameState, true)
      expect(enabledState.isDomesticateEnabled).toBe(true)

      const disabledState = setDomesticateEnabled(enabledState, false)
      expect(disabledState.isDomesticateEnabled).toBe(false)
    })
  })
})
