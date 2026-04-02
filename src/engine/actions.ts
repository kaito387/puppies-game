import { type GameState, JOBS } from '@/engine/types'
import { min } from './utils'

export function clickResource(state: GameState, resourceId: string, amount: number = 1): GameState {
  const newResourceCounts = { ...state.resourceCounts }
  newResourceCounts[resourceId] = min(
    (newResourceCounts[resourceId] || 0) + amount,
    state.resourceLimits[resourceId] || 0,
  )

  return {
    ...state,
    resourceCounts: newResourceCounts,
  }
}

export function setJobAssignment(state: GameState, jobId: string, assignedCount: number): GameState {
  const job = JOBS.find((j) => j.id === jobId)
  if (!job) {
    throw new Error(`职业 ${jobId} 不存在`)
  }

  if (!Number.isInteger(assignedCount) || assignedCount < 0) {
    throw new Error('职业分配数量必须是非负整数')
  }

  const currentPopulation = state.resourceCounts.puppies
  const totalAssignedExceptCurrentJob = Object.entries(state.jobAssignments)
    .filter(([assignedJobId]) => assignedJobId !== jobId)
    .reduce((sum, [, count]) => sum + count, 0)

  if (totalAssignedExceptCurrentJob + assignedCount > currentPopulation) {
    throw new Error('职业分配总人数不能超过当前人口')
  }

  return {
    ...state,
    jobAssignments: {
      ...state.jobAssignments,
      [job.id]: assignedCount,
    },
  }
}

export function rebalanceJobAssignments(
  jobAssignments: Record<string, number>,
  currentPopulation: number,
): Record<string, number> {
  const populationLimit = Math.max(0, Math.floor(currentPopulation))
  const totalAssigned = Object.values(jobAssignments).reduce((sum, count) => sum + count, 0)

  if (totalAssigned <= populationLimit) {
    return { ...jobAssignments }
  }

  const nextAssignments = { ...jobAssignments }
  let toRemove = totalAssigned - populationLimit

  // Keep assignment reduction deterministic by removing from lower-priority jobs first.
  for (let i = JOBS.length - 1; i >= 0 && toRemove > 0; i -= 1) {
    const jobId = JOBS[i].id
    const assigned = nextAssignments[jobId] || 0
    if (assigned <= 0) {
      continue
    }

    const removed = Math.min(assigned, toRemove)
    nextAssignments[jobId] = assigned - removed
    toRemove -= removed
  }

  return nextAssignments
}
