import { describe, it, expect, beforeEach } from 'vitest'
import {
  assignDogJob,
  clickResource,
  rebalanceJobAssignments,
  renameDog,
  setDomesticateEnabled,
  setJobAssignment,
} from '@/engine/actions'
import { type GameState } from '@/engine/types'
import { createInitialGameState } from '@/engine/initialState'
import { createDogs } from '@/engine/dogs'
import { calculateResourceLimits } from '@/engine/gameLoop'

describe('Actions', () => {
  let gameState: GameState

  beforeEach(() => {
    gameState = createInitialGameState()
  })

  function withDogs(count: number) {
    gameState.dogs = createDogs(count)
  }

  describe('Clicking Resources', () => {
    it('should increase resource count when clicking', () => {
      const newState = clickResource(gameState, 'wood', 3, calculateResourceLimits(gameState))
      expect(newState.resourceCounts.wood).toBe(3)
    })

    it('should default to increasing by 1 if amount is not specified', () => {
      const newState = clickResource(gameState, 'wood', 1, calculateResourceLimits(gameState))
      expect(newState.resourceCounts.wood).toBe(1)
    })

    it('should not exceed resource limits when clicking', () => {
      const limits = calculateResourceLimits(gameState)
      limits.wood = 5
      const newState = clickResource(gameState, 'wood', 10, limits)
      expect(newState.resourceCounts.wood).toBe(5)
    })
  })

  describe('Job Assignment', () => {
    it('should set job assignment when population is enough', () => {
      withDogs(3)
      gameState.buildings.farm = 1
      const newState = setJobAssignment(gameState, 'farmer', 2)
      expect(newState.dogs.filter((dog) => dog.currentJobId === 'farmer')).toHaveLength(2)
    })

    it('should reject assignment when total workers exceed population', () => {
      withDogs(2)
      gameState.buildings.farm = 1
      gameState = setJobAssignment(gameState, 'farmer', 1)
      expect(() => setJobAssignment(gameState, 'lumberjack', 2)).toThrow('职业分配总人数不能超过当前人口')
    })

    it('should reject unknown jobs', () => {
      expect(() => setJobAssignment(gameState, 'unknown', 1)).toThrow('职业 unknown 不存在')
    })

    it('should reject negative assignment count', () => {
      gameState.buildings.farm = 1
      expect(() => setJobAssignment(gameState, 'farmer', -1)).toThrow('职业分配数量必须是非负整数')
    })

    it('should assign and unassign an individual dog by id', () => {
      withDogs(2)
      gameState.buildings.farm = 1
      const targetDogId = gameState.dogs[0].id

      const assigned = assignDogJob(gameState, targetDogId, 'farmer')
      expect(assigned.dogs.filter((dog) => dog.currentJobId === 'farmer')).toHaveLength(1)

      const unassigned = assignDogJob(assigned, targetDogId, null)
      expect(unassigned.dogs.filter((dog) => dog.currentJobId === 'farmer')).toHaveLength(0)
    })

    it('should rename dog with validation', () => {
      withDogs(1)
      const targetDogId = gameState.dogs[0].id
      const renamed = renameDog(gameState, targetDogId, '  阿福  ')
      expect(renamed.dogs[0].name).toBe('阿福')

      expect(() => renameDog(gameState, targetDogId, ' '.repeat(20))).toThrow('小狗名字长度必须在 1-16 个字符')
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
