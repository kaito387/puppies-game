import { type GameState, JOBS } from '@/engine/types'
import { min } from './utils'
import { isRequirementSatisfied } from '@/engine/technologies'
import { isDogNameValid, normalizeDogStatus, sanitizeDogName } from '@/engine/dogs'

// NOTE: clickResource will need resourceLimits every time might lead to some redundant calculations.
// If performance becomes an issue, we can consider caching the limits in the state or calculating them
// in a higher-level function and passing them down.
export function clickResource(
  state: GameState,
  resourceId: string,
  amount: number = 1,
  resourceLimits: Record<string, number>,
): GameState {
  const newResourceCounts = { ...state.resourceCounts }
  newResourceCounts[resourceId] = min(
    (newResourceCounts[resourceId] || 0) + amount,
    resourceLimits[resourceId] || 0,
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

  if (!isRequirementSatisfied(state, job.prerequisites || {})) {
    throw new Error(`职业 ${jobId} 尚未解锁`)
  }

  if (!Number.isInteger(assignedCount) || assignedCount < 0) {
    throw new Error('职业分配数量必须是非负整数')
  }

  const currentAssignedDogs = state.dogs.filter((dog) => dog.currentJobId === jobId)
  const currentAssigned = currentAssignedDogs.length
  const delta = assignedCount - currentAssigned

  if (delta === 0) {
    return state
  }

  if (delta > 0) {
    const idleDogs = state.dogs.filter((dog) => dog.currentJobId === null)
    if (idleDogs.length < delta) {
      throw new Error('职业分配总人数不能超过当前人口')
    }

    const selectedIds = new Set(idleDogs.slice(0, delta).map((dog) => dog.id))
    const nextDogs = state.dogs.map((dog) => {
      if (!selectedIds.has(dog.id)) {
        return dog
      }

      return {
        ...dog,
        currentJobId: jobId,
        status: normalizeDogStatus(jobId),
      }
    })

    return {
      ...state,
      dogs: nextDogs,
    }
  }

  const toUnassign = Math.abs(delta)
  const removeIds = new Set(
    state.dogs
      .filter((dog) => dog.currentJobId === jobId)
      .slice(-toUnassign)
      .map((dog) => dog.id),
  )

  const nextDogs = state.dogs.map((dog) => {
    if (!removeIds.has(dog.id)) {
      return dog
    }

    return {
      ...dog,
      currentJobId: null,
      status: normalizeDogStatus(null),
    }
  })

  return {
    ...state,
    dogs: nextDogs,
  }
}

export function assignDogJob(state: GameState, dogId: string, jobId: string | null): GameState {
  if (jobId) {
    const job = JOBS.find((candidate) => candidate.id === jobId)
    if (!job) {
      throw new Error(`职业 ${jobId} 不存在`)
    }

    if (!isRequirementSatisfied(state, job.prerequisites || {})) {
      throw new Error(`职业 ${jobId} 尚未解锁`)
    }
  }

  const targetDog = state.dogs.find((dog) => dog.id === dogId)
  if (!targetDog) {
    throw new Error(`小狗 ${dogId} 不存在`)
  }

  const nextDogs = state.dogs.map((dog) => {
    if (dog.id !== dogId) {
      return dog
    }

    return {
      ...dog,
      currentJobId: jobId,
      status: normalizeDogStatus(jobId),
    }
  })

  return {
    ...state,
    dogs: nextDogs,
  }
}

export function renameDog(state: GameState, dogId: string, nextName: string): GameState {
  if (!isDogNameValid(nextName)) {
    throw new Error('小狗名字长度必须在 1-16 个字符')
  }

  const normalizedName = sanitizeDogName(nextName)
  const targetDog = state.dogs.find((dog) => dog.id === dogId)
  if (!targetDog) {
    throw new Error(`小狗 ${dogId} 不存在`)
  }

  const nextDogs = state.dogs.map((dog) => {
    if (dog.id !== dogId) {
      return dog
    }

    return {
      ...dog,
      name: normalizedName,
    }
  })

  return {
    ...state,
    dogs: nextDogs,
  }
}

export function setDomesticateEnabled(state: GameState, enabled: boolean): GameState {
  return {
    ...state,
    isDomesticateEnabled: enabled,
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

export function setLeaderDog(state: GameState, dogId: string | null): GameState {
  if (dogId) {
    const targetDog = state.dogs.find((dog) => dog.id === dogId)
    if (!targetDog) {
      throw new Error(`小狗 ${dogId} 不存在`)
    }
  }

  return {
    ...state,
    leaderDogId: dogId,
  }
}