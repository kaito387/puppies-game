import { describe, it, expect, beforeEach } from 'vitest'
import {
  assignDogJob,
  clickResource,
  rebalanceJobAssignments,
  renameDog,
  setDomesticateEnabled,
  setJobAssignment,
  setLeaderDog,
  performExplore,
  getRewardFromExploration,
  enactPolicy,
} from '@/engine/actions'
import { type GameState } from '@/engine/types'
import { createInitialGameState } from '@/engine/initialState'
import { createDogs } from '@/engine/dogs'
import { calculateResourceLimits } from '@/engine/gameLoop'
import {
  DOGPOWER_PER_EXPLORATION,
  FUR_REWARD_MIN,
  FUR_REWARD_MAX,
} from '@/engine/constants'
import { canEnactPolicy } from '@/engine/policies'

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

    it('should return state unchanged when delta is zero', () => {
      withDogs(2)
      gameState.buildings.farm = 1
      const after = setJobAssignment(gameState, 'farmer', 1)
      const again = setJobAssignment(after, 'farmer', 1)
      expect(again).toBe(after)
    })

    it('should decrease job assignment when count is reduced', () => {
      withDogs(3)
      gameState.buildings.farm = 1
      const assigned = setJobAssignment(gameState, 'farmer', 3)
      const reduced = setJobAssignment(assigned, 'farmer', 1)
      expect(reduced.dogs.filter((dog) => dog.currentJobId === 'farmer')).toHaveLength(1)
      expect(reduced.dogs.filter((dog) => dog.currentJobId === null)).toHaveLength(2)
    })

    it('should unassign all dogs from a job when count is set to zero', () => {
      withDogs(2)
      gameState.buildings.farm = 1
      const assigned = setJobAssignment(gameState, 'farmer', 2)
      const cleared = setJobAssignment(assigned, 'farmer', 0)
      expect(cleared.dogs.filter((dog) => dog.currentJobId === 'farmer')).toHaveLength(0)
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

    it('should reject assignment when job prerequisites are not met', () => {
      withDogs(1)
      expect(() => setJobAssignment(gameState, 'farmer', 1)).toThrow('职业 farmer 尚未解锁')
    })

    it('should throw when assigning unknown jobId via assignDogJob', () => {
      withDogs(1)
      const targetDogId = gameState.dogs[0].id
      expect(() => assignDogJob(gameState, targetDogId, 'nonexistent-job')).toThrow('职业 nonexistent-job 不存在')
    })

    it('should reject assigning locked job to individual dog', () => {
      withDogs(1)
      const targetDogId = gameState.dogs[0].id
      expect(() => assignDogJob(gameState, targetDogId, 'miner')).toThrow('职业 miner 尚未解锁')
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

    it('should throw when assigning a dog that does not exist', () => {
      expect(() => assignDogJob(gameState, 'nonexistent-dog', 'lumberjack')).toThrow('不存在')
    })

    it('should rename dog successfully and update name', () => {
      withDogs(1)
      const targetDogId = gameState.dogs[0].id
      const renamed = renameDog(gameState, targetDogId, '  阿福  ')
      expect(renamed.dogs[0].name).toBe('阿福')
      expect(renamed.dogs[0].id).toBe(targetDogId)
    })

    it('should throw when renaming with invalid name', () => {
      withDogs(1)
      const targetDogId = gameState.dogs[0].id
      expect(() => renameDog(gameState, targetDogId, ' '.repeat(20))).toThrow('小狗名字长度必须在 1-16 个字符')
    })

    it('should throw when renaming a dog that does not exist', () => {
      expect(() => renameDog(gameState, 'nonexistent-dog', '阿福')).toThrow('不存在')
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

  describe('setLeaderDog', () => {
    beforeEach(() => {
      withDogs(3)
    })

    it('should set a valid dog as leader', () => {
      const dogId = gameState.dogs[0].id
      const next = setLeaderDog(gameState, dogId)
      expect(next.leaderDogId).toBe(dogId)
    })

    it('should replace the current leader when a new leader is set', () => {
      const firstId = gameState.dogs[0].id
      const secondId = gameState.dogs[1].id

      const after1 = setLeaderDog(gameState, firstId)
      const after2 = setLeaderDog(after1, secondId)

      expect(after2.leaderDogId).toBe(secondId)
    })

    it('should clear the leader when null is passed', () => {
      const dogId = gameState.dogs[0].id
      const withLeader = setLeaderDog(gameState, dogId)
      const cleared = setLeaderDog(withLeader, null)

      expect(cleared.leaderDogId).toBeNull()
    })

    it('should throw when dogId does not exist in dogs array', () => {
      expect(() => setLeaderDog(gameState, 'nonexistent-dog-id')).toThrow('不存在')
    })

    it('should not mutate the original state', () => {
      const originalLeader = gameState.leaderDogId
      setLeaderDog(gameState, gameState.dogs[0].id)
      expect(gameState.leaderDogId).toBe(originalLeader)
    })

    it('should accept null even when no leader is currently set', () => {
      expect(gameState.leaderDogId).toBeNull()
      const next = setLeaderDog(gameState, null)
      expect(next.leaderDogId).toBeNull()
    })

    it('should preserve all other state fields when setting a leader', () => {
      const dogId = gameState.dogs[0].id
      const next = setLeaderDog(gameState, dogId)

      expect(next.dogs).toEqual(gameState.dogs)
      expect(next.resourceCounts).toEqual(gameState.resourceCounts)
      expect(next.researchedTechIds).toEqual(gameState.researchedTechIds)
      expect(next.buildings).toEqual(gameState.buildings)
    })
  })

  describe('Exploration', () => {
    it('should block exploration when dogpower is insufficient', () => {
      gameState.resourceCounts.dogpower = 50
      const { blockedReason } = performExplore(gameState)
      expect(blockedReason).toBe('insufficientDogpower')
    })

    it('should block exploration when fur storage is full', () => {
      gameState.resourceCounts.dogpower = 200
      gameState.resourceCounts.fur = 0
      const limits = calculateResourceLimits(gameState)
      gameState.resourceCounts.fur = limits.fur
      const { blockedReason, furReward } = performExplore(gameState)
      expect(blockedReason).toBe('furStorageFull')
      expect(furReward).toBe(0)
    })

    it('should deduct dogpower on exploration attempt', () => {
      gameState.buildings.barn = 10
      gameState.resourceCounts.dogpower = 200
      const { nextState } = performExplore(gameState)
      expect(nextState.resourceCounts.dogpower).toBe(200 - DOGPOWER_PER_EXPLORATION)
    })

    it('should reward fur on successful exploration roll', () => {
      const reward = getRewardFromExploration(0.6, FUR_REWARD_MIN, FUR_REWARD_MAX, 0, 0)
      expect(reward).toBe(FUR_REWARD_MIN)
    })

    it('should give zero fur on failed exploration roll', () => {
      const reward = getRewardFromExploration(0.6, FUR_REWARD_MIN, FUR_REWARD_MAX, 1.0)
      expect(reward).toBe(0)
    })
  })

  describe('enactPolicy', () => {
    it('should deduct culture cost from resources', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 300
      const next = enactPolicy(gameState, 'policy-democracy')
      expect(next.resourceCounts.culture).toBe(0)
    })

    it('should append policy to enactedPolicyIds', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 300
      const next = enactPolicy(gameState, 'policy-democracy')
      expect(next.enactedPolicyIds).toContain('policy-democracy')
    })

    it('should not mutate the original state', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 300
      enactPolicy(gameState, 'policy-democracy')
      expect(gameState.enactedPolicyIds).not.toContain('policy-democracy')
      expect(gameState.resourceCounts.culture).toBe(300)
    })

    it('should throw when prerequisites are not met', () => {
      gameState.buildings.library = 0
      gameState.resourceCounts.culture = 300
      expect(() => enactPolicy(gameState, 'policy-democracy')).toThrow('不满足实施条件')
    })

    it('should throw when culture is insufficient', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 0
      expect(() => enactPolicy(gameState, 'policy-democracy')).toThrow('不满足实施条件')
    })

    it('canEnactPolicy returns false for sibling after one policy in group is enacted', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 600
      const after = enactPolicy(gameState, 'policy-democracy')
      expect(canEnactPolicy(after, 'policy-authoritarian')).toBe(false)
    })

    it('canEnactPolicy returns false when same policy enacted twice', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 600
      const after = enactPolicy(gameState, 'policy-democracy')
      expect(canEnactPolicy(after, 'policy-democracy')).toBe(false)
    })
  })
})