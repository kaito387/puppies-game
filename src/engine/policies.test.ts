import { describe, it, expect, beforeEach } from 'vitest'
import { type GameState } from '@/engine/types'
import { createInitialGameState } from '@/engine/initialState'
import {
  getPolicyById,
  isPolicyEnacted,
  getPolicyGroupByPolicyId,
  canEnactPolicyGroup,
  canEnactPolicy,
  getVisiblePolicyGroupIds,
  getPoliciesByGroup,
  getVisiblePolicyGroups,
} from '@/engine/policies'
import { enactPolicy } from '@/engine/actions'
import { POLICY_GROUPS } from '@/engine/types'

describe('Policies', () => {
  let gameState: GameState

  beforeEach(() => {
    gameState = createInitialGameState()
  })

  describe('getPolicyById', () => {
    it('should return the correct policy for a known id', () => {
      const policy = getPolicyById('policy-democracy')
      expect(policy.id).toBe('policy-democracy')
      expect(policy.name).toBe('民主')
    })

    it('should throw when policy id does not exist', () => {
      expect(() => getPolicyById('nonexistent-policy')).toThrow('不存在')
    })
  })

  describe('isPolicyEnacted', () => {
    it('should return false when no policies have been enacted', () => {
      expect(isPolicyEnacted(gameState, 'policy-democracy')).toBe(false)
    })

    it('should return true after a policy is added to enactedPolicyIds', () => {
      gameState.enactedPolicyIds = ['policy-democracy']
      expect(isPolicyEnacted(gameState, 'policy-democracy')).toBe(true)
    })

    it('should return false for a different policy even when others are enacted', () => {
      gameState.enactedPolicyIds = ['policy-democracy']
      expect(isPolicyEnacted(gameState, 'policy-authoritarian')).toBe(false)
    })

    it('should handle missing enactedPolicyIds gracefully', () => {
      const corruptState = { ...gameState, enactedPolicyIds: undefined } as unknown as GameState
      expect(isPolicyEnacted(corruptState, 'policy-democracy')).toBe(false)
    })
  })

  describe('getPolicyGroupByPolicyId', () => {
    it('should return the group that contains the given policy id', () => {
      const group = getPolicyGroupByPolicyId('policy-democracy')
      expect(group.policyIds).toContain('policy-democracy')
      expect(group.policyIds).toContain('policy-authoritarian')
    })

    it('should return the correct group for a policy in the second group', () => {
      const group = getPolicyGroupByPolicyId('policy-radical')
      expect(group.policyIds).toContain('policy-radical')
      expect(group.policyIds).toContain('policy-conservative')
    })

    it('should throw when the policy id belongs to no group', () => {
      expect(() => getPolicyGroupByPolicyId('nonexistent-policy')).toThrow('不存在')
    })
  })

  describe('canEnactPolicyGroup', () => {
    it('should return false when prerequisites are not met', () => {
      const group = getPolicyGroupByPolicyId('policy-democracy') // requires library
      gameState.buildings.library = 0
      expect(canEnactPolicyGroup(gameState, group)).toBe(false)
    })

    it('should return false when culture is insufficient', () => {
      const group = getPolicyGroupByPolicyId('policy-democracy')
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 79
      expect(canEnactPolicyGroup(gameState, group)).toBe(false)
    })

    it('should return true when prerequisites are met and resources are sufficient', () => {
      const group = getPolicyGroupByPolicyId('policy-democracy')
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 80
      expect(canEnactPolicyGroup(gameState, group)).toBe(true)
    })

    it('should return false when any policy in the group is already enacted', () => {
      const group = getPolicyGroupByPolicyId('policy-democracy')
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 600
      gameState.enactedPolicyIds = ['policy-democracy']
      expect(canEnactPolicyGroup(gameState, group)).toBe(false)
    })

    it('should return false when the sibling policy in the group is already enacted', () => {
      const group = getPolicyGroupByPolicyId('policy-authoritarian')
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 600
      gameState.enactedPolicyIds = ['policy-democracy']
      expect(canEnactPolicyGroup(gameState, group)).toBe(false)
    })

    it('should handle a group with no prerequisites field', () => {
      const group = { policyIds: ['policy-democracy'], cost: { culture: 0 } }
      gameState.resourceCounts.culture = 0
      expect(canEnactPolicyGroup(gameState, group)).toBe(true)
    })
  })

  describe('canEnactPolicy', () => {
    it('should return false when prerequisites are not met', () => {
      gameState.buildings.library = 0
      expect(canEnactPolicy(gameState, 'policy-democracy')).toBe(false)
    })

    it('should return false when resources are insufficient', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 0
      expect(canEnactPolicy(gameState, 'policy-democracy')).toBe(false)
    })

    it('should return true when all conditions are satisfied', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 80
      expect(canEnactPolicy(gameState, 'policy-democracy')).toBe(true)
    })

    it('should return false once the policy itself is already enacted', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 600
      gameState.enactedPolicyIds = ['policy-democracy']
      expect(canEnactPolicy(gameState, 'policy-democracy')).toBe(false)
    })

    it('should return false for sibling policy when one in the group is enacted (mutual exclusion)', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 600
      gameState.enactedPolicyIds = ['policy-democracy']
      expect(canEnactPolicy(gameState, 'policy-authoritarian')).toBe(false)
    })

    it('should allow enacting a policy from a different group while one group already has an enacted policy', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 2000
      gameState.enactedPolicyIds = ['policy-democracy']
      expect(canEnactPolicy(gameState, 'policy-environment')).toBe(true)
    })

    it('should throw when policy id does not belong to any group', () => {
      expect(() => canEnactPolicy(gameState, 'nonexistent-policy')).toThrow('不存在')
    })
  })

  describe('getVisiblePolicyGroupIds', () => {
    it('should return no group ids when prerequisites are not met', () => {
      const ids = getVisiblePolicyGroupIds(gameState)
      expect(ids).toEqual([])
    })

    it('should return the index of groups whose prerequisites are satisfied', () => {
      gameState.buildings.library = 1
      const ids = getVisiblePolicyGroupIds(gameState)
      expect(ids).toContain(0)
      expect(ids).toContain(2)
      expect(ids).not.toContain(1)
    })

    it('should return all group indices when all prerequisites are met', () => {
      gameState.buildings.library = 1
      gameState.buildings.workshop = 1
      const ids = getVisiblePolicyGroupIds(gameState)
      expect(ids).toEqual([0, 1, 2])
    })

    it('returned indices should map back to the correct POLICY_GROUPS entries', () => {
      gameState.buildings.library = 1
      const ids = getVisiblePolicyGroupIds(gameState)
      for (const idx of ids) {
        expect(POLICY_GROUPS[idx]).toBeDefined()
      }
    })
  })

  describe('getPoliciesByGroup', () => {
    it('should return one array per policy group', () => {
      const groups = getPoliciesByGroup()
      expect(groups).toHaveLength(POLICY_GROUPS.length)
    })

    it('should return policies in the same order as POLICY_GROUPS', () => {
      const groups = getPoliciesByGroup()
      groups.forEach((group, groupIdx) => {
        group.forEach((policy, policyIdx) => {
          expect(policy.id).toBe(POLICY_GROUPS[groupIdx].policyIds[policyIdx])
        })
      })
    })

    it('each inner array should contain full Policy objects (not just ids)', () => {
      const groups = getPoliciesByGroup()
      for (const group of groups) {
        for (const policy of group) {
          expect(policy).toHaveProperty('id')
          expect(policy).toHaveProperty('name')
          expect(policy).toHaveProperty('description')
        }
      }
    })

    it('first group should contain democracy and authoritarian policies', () => {
      const groups = getPoliciesByGroup()
      const firstGroup = groups[0]
      expect(firstGroup.map((p) => p.id)).toEqual(['policy-democracy', 'policy-authoritarian'])
    })
  })

  describe('getVisiblePolicyGroups', () => {
    it('should return no groups when prerequisites are not satisfied', () => {
      expect(getVisiblePolicyGroups(gameState)).toHaveLength(0)
    })

    it('should return groups whose prerequisites are satisfied', () => {
      gameState.buildings.library = 1
      const visible = getVisiblePolicyGroups(gameState)
      expect(visible.length).toBeGreaterThan(0)
      for (const group of visible) {
        expect(group.policyIds.length).toBeGreaterThan(0)
      }
    })

    it('result should be a subset of POLICY_GROUPS', () => {
      gameState.buildings.library = 1
      const visible = getVisiblePolicyGroups(gameState)
      for (const group of visible) {
        expect(POLICY_GROUPS).toContainEqual(group)
      }
    })
  })

  describe('enactPolicy (action integration)', () => {
    it('should add the policy to enactedPolicyIds', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 80
      const next = enactPolicy(gameState, 'policy-democracy')
      expect(next.enactedPolicyIds).toContain('policy-democracy')
    })

    it('should deduct the group cost from resources', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 80
      const next = enactPolicy(gameState, 'policy-democracy')
      expect(next.resourceCounts.culture).toBe(0)
    })

    it('should not mutate the original state', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 80
      enactPolicy(gameState, 'policy-democracy')
      expect(gameState.enactedPolicyIds).not.toContain('policy-democracy')
      expect(gameState.resourceCounts.culture).toBe(80)
    })

    it('should throw when prerequisites are not met', () => {
      gameState.buildings.library = 0
      gameState.resourceCounts.culture = 80
      expect(() => enactPolicy(gameState, 'policy-democracy')).toThrow('不满足实施条件')
    })

    it('should throw when culture is insufficient', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 0
      expect(() => enactPolicy(gameState, 'policy-democracy')).toThrow('不满足实施条件')
    })

    it('should throw when the same policy is enacted twice', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 600
      const after = enactPolicy(gameState, 'policy-democracy')
      expect(() => enactPolicy(after, 'policy-democracy')).toThrow('不满足实施条件')
    })

    it('should throw when trying to enact the sibling policy after one is already enacted', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 600
      const after = enactPolicy(gameState, 'policy-democracy')
      expect(() => enactPolicy(after, 'policy-authoritarian')).toThrow('不满足实施条件')
    })

    it('should allow enacting policies from two different groups independently', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 2000
      const after1 = enactPolicy(gameState, 'policy-democracy')
      const after2 = enactPolicy(after1, 'policy-environment')
      expect(after2.enactedPolicyIds).toContain('policy-democracy')
      expect(after2.enactedPolicyIds).toContain('policy-environment')
    })

    it('should preserve all other state fields after enacting a policy', () => {
      gameState.buildings.library = 1
      gameState.resourceCounts.culture = 80
      const next = enactPolicy(gameState, 'policy-democracy')
      expect(next.dogs).toEqual(gameState.dogs)
      expect(next.buildings).toEqual(gameState.buildings)
      expect(next.researchedTechIds).toEqual(gameState.researchedTechIds)
    })
  })
})
