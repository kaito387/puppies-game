import { create } from 'zustand'
import {
  type GameState,
  createInitialGameState,
  createInitialResourceDeltaPerTick,
  type GameLog,
  JOBS,
} from '@/engine/types'
import { calculateResourceLimits, tick as engineTick } from '@/engine/gameLoop'
import {
  assignDogJob,
  clickResource,
  renameDog,
  setDomesticateEnabled,
  setJobAssignment,
} from '@/engine/actions'
import { buildBuilding, canBuildBuilding, getBuildingCost } from '@/engine/buildings'
import { saveGame, loadGame, resetGame } from '@/engine/save'
import {
  canResearchTechnology,
  getVisibleTechnologiesIds,
  researchTechnology,
  getUnlockedBuildingsIds,
  getUnlockedJobsIds,
} from '@/engine/technologies'
import { getJobAssignment } from '@/engine/dogs'
import { min } from '@/engine/utils'

const MAX_LOGS = 100

function addLog(logs: GameLog[], log: Omit<GameLog, 'id'>): GameLog[] {
  const newLog: GameLog = {
    ...log,
    id: `${log.type}-${log.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
  }
  
  return [newLog, ...logs].slice(0, MAX_LOGS)
}

interface GameStore {
  gameState: GameState
  resourceDeltaPerTick: Record<string, number>
  logs: GameLog[]
  unreadLogCount: number

  tick: () => void

  buildBuilding: (buildingId: string) => void
  getBuildingCost: (buildingId: string) => Record<string, number>
  canBuildBuilding: (buildingId: string) => boolean
  getUnlockedBuildingIds: () => string[]
  getUnlockedJobIds: () => string[]
  getJobAssignment: (jobId: string) => number
  clickResource: (resourceId: string, amount?: number) => void
  setJobAssignment: (jobId: string, assignedCount: number) => void
  assignDogJob: (dogId: string, jobId: string | null) => void
  renameDog: (dogId: string, nextName: string) => void
  setDomesticateEnabled: (enabled: boolean) => void
  researchTechnology: (techId: string) => void
  canResearchTechnology: (techId: string) => boolean
  getVisibleTechnologiesIds: () => string[]

  addGameLog: (log: Omit<GameLog, 'id'>) => void
  markLogsAsRead: () => void

  saveGame: () => void
  loadGame: () => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: loadGame(),
  resourceDeltaPerTick: createInitialResourceDeltaPerTick(),
  logs: [],
  unreadLogCount: 0,

  tick: () => {
    set((gameStore) => {
      const { gameState, events } = engineTick(gameStore.gameState)
      const nextResourceDeltaPerTick: Record<string, number> = createInitialResourceDeltaPerTick()
      Object.keys(nextResourceDeltaPerTick).forEach((resourceId) => {
        nextResourceDeltaPerTick[resourceId] =
          (gameState.resourceCounts[resourceId] || 0) - (gameStore.gameState.resourceCounts[resourceId] || 0)
      })
  
      let newLogs = gameStore.logs
      let unreadDelta = 0
  
      for (const event of events) {
        if (event.type === 'death') {
          newLogs = addLog(newLogs, {
            timestamp: Date.now(),
            type: 'death',
            message: `${event.dogName} 死于饥荒`,
          })
          unreadDelta += 1
        }
      }
  
      return {
        gameState,
        resourceDeltaPerTick: nextResourceDeltaPerTick,
        logs: newLogs,
        unreadLogCount: min(100, gameStore.unreadLogCount + unreadDelta),
      }
    })
  },

  buildBuilding: (buildingId: string) => {
    set((gameStore) => ({
      gameState: buildBuilding(gameStore.gameState, buildingId),
    }))
  },

  getBuildingCost: (buildingId: string) => {
    return getBuildingCost(get().gameState, buildingId)
  },

  canBuildBuilding: (buildingId: string) => {
    return canBuildBuilding(get().gameState, buildingId)
  },

  getUnlockedBuildingIds: () => {
    return getUnlockedBuildingsIds(get().gameState)
  },

  getUnlockedJobIds: () => {
    return getUnlockedJobsIds(get().gameState)
  },

  getJobAssignment: (jobId: string) => {
    return getJobAssignment(get().gameState.dogs, jobId)
  },

  clickResource: (resourceId: string, amount: number = 1) => {
    set((gameStore) => {
      const resourceLimits = calculateResourceLimits(gameStore.gameState)
      return {
        gameState: clickResource(gameStore.gameState, resourceId, amount, resourceLimits),
      }
    })
  },

  setJobAssignment: (jobId: string, assignedCount: number) => {
    set((gameStore) => ({
      gameState: setJobAssignment(gameStore.gameState, jobId, assignedCount),
    }))
  },

  assignDogJob: (dogId: string, jobId: string | null) => {
    const beforeState = get().gameState
    const beforeDog = beforeState.dogs.find((dog) => dog.id === dogId)
    const nextGameState = assignDogJob(beforeState, dogId, jobId)
    set(() => ({
      gameState: nextGameState,
    }))

    const nextDog = nextGameState.dogs.find((dog) => dog.id === dogId)
    if (beforeDog && nextDog && beforeDog.currentJobId !== nextDog.currentJobId) {
      const targetJobName = jobId ? JOBS.find((job) => job.id === jobId)?.name ?? jobId : '空闲'

      get().addGameLog({
        timestamp: Date.now(),
        type: 'dog_assigned',
        message: `${beforeDog.name} 调整为 ${targetJobName}`,
      })
    }
  },

  renameDog: (dogId: string, nextName: string) => {
    const beforeState = get().gameState
    const beforeDog = beforeState.dogs.find((dog) => dog.id === dogId)
    const nextGameState = renameDog(beforeState, dogId, nextName)
    set(() => ({
      gameState: nextGameState,
    }))

    const nextDog = nextGameState.dogs.find((dog) => dog.id === dogId)
    if (beforeDog && nextDog && beforeDog.name !== nextDog.name) {
      get().addGameLog({
        timestamp: Date.now(),
        type: 'dog_renamed',
        message: `${beforeDog.name} 改名为 ${nextDog.name}`,
      })
    }
  },

  setDomesticateEnabled: (enabled: boolean) => {
    set((gameStore) => ({
      gameState: setDomesticateEnabled(gameStore.gameState, enabled),
    }))
  },

  researchTechnology: (techId: string) => {
    set((gameStore) => ({
      gameState: researchTechnology(gameStore.gameState, techId),
    }))
  },

  canResearchTechnology: (techId: string) => {
    return canResearchTechnology(get().gameState, techId)
  },

  getVisibleTechnologiesIds: () => {
    return getVisibleTechnologiesIds(get().gameState)
  },

  addGameLog: (log: Omit<GameLog, 'id'>) => {
    set((gameStore) => ({
      logs: addLog(gameStore.logs, log),
      unreadLogCount: gameStore.unreadLogCount + 1,
    }))
  },

  markLogsAsRead: () => {
    set(() => ({
      unreadLogCount: 0,
    }))
  },

  saveGame: () => {
    const { gameState } = get()
    saveGame(gameState)
  },

  loadGame: () => {
    set(() => ({
      gameState: loadGame(),
      resourceDeltaPerTick: createInitialResourceDeltaPerTick(),
      logs: [],
      unreadLogCount: 0,
    }))
  },

  resetGame: () => {
    resetGame()
    set(() => ({
      gameState: createInitialGameState(),
      resourceDeltaPerTick: createInitialResourceDeltaPerTick(),
      logs: [],
      unreadLogCount: 0,
    }))
  },
}))
