import {
  POLICIES,
  POLICY_GROUPS,
  type Policy,
  type PolicyGroup,
  type GameState,
} from '@/engine/types'

import { isRequirementSatisfied } from '@/engine/technologies'

export function getPolicyById(policyId: string): Policy {
  const policy = POLICIES.find((item) => item.id === policyId)
  if (!policy) {
    throw new Error(`Policy ${policyId} 不存在`)
  }

  return policy
}

export function isPolicyEnacted(state: GameState, policyId: string): boolean {
  return (state.enactedPolicyIds || []).includes(policyId)
}

export function getPolicyGroupByPolicyId(policyId: string): PolicyGroup {
  const policyGroup = POLICY_GROUPS.find((group) => group.policyIds.includes(policyId))
  if (!policyGroup) {
    throw new Error(`PolicyGroup ${policyId} 不存在`)
  }

  return policyGroup
}

export function canEnactPolicyGroup(state: GameState, policyGroup: PolicyGroup): boolean {

  if (policyGroup.prerequisites && !isRequirementSatisfied(state, policyGroup.prerequisites)) {
    return false
  }

  for (const policyId of policyGroup.policyIds) {
    if (isPolicyEnacted(state, policyId)) {
      return false
    }
  }

  for (const [resourceId, cost] of Object.entries(policyGroup.cost || {})) {
    if ((state.resourceCounts[resourceId] || 0) < cost) {
      return false
    }
  }

  return true
}

export function canEnactPolicy(state: GameState, policyId: string): boolean {
  const policyGroup = getPolicyGroupByPolicyId(policyId)

  if (!canEnactPolicyGroup(state, policyGroup)) {
    return false
  }

  return !isPolicyEnacted(state, policyId)
}

export function getVisiblePolicyGroupIds(state: GameState): number[] {
  return POLICY_GROUPS
    .map((group, index) => ({ group, index }))
    .filter(({ group }) => isRequirementSatisfied(state, group.prerequisites || {}))
    .map(({ index }) => index)
}

export function getPoliciesByGroup(): Policy[][] {
  return POLICY_GROUPS.map((group) => group.policyIds.map((policyId) => getPolicyById(policyId)))
}

export function getVisiblePolicyGroups(state: GameState): PolicyGroup[] {
  return POLICY_GROUPS.filter((group) => isRequirementSatisfied(state, group.prerequisites || {}))
}