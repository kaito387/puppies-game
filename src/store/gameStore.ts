import { create } from 'zustand'
import { type GameState, createInitialGameState, type GameLog } from '@/engine/types'
import { tick as engineTick } from '@/engine/gameLoop'
import { clickResource, setDomesticateEnabled, setJobAssignment } from '@/engine/actions'
import { buildBuilding, canBuildBuilding, getBuildingCost } from '@/engine/buildings'
import { saveGame, loadGame, resetGame } from '@/engine/save'
import {
  canResearchTechnology,
  getVisibleTechnologiesIds,
  researchTechnology,
  getUnlockedBuildingsIds,
  getUnlockedJobsIds,
} from '@/engine/technologies'
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
  logs: GameLog[]
  unreadLogCount: number

  tick: () => void

  buildBuilding: (buildingId: string) => void
  getBuildingCost: (buildingId: string) => Record<string, number>
  canBuildBuilding: (buildingId: string) => boolean
  getUnlockedBuildingIds: () => string[]
  getUnlockedJobIds: () => string[]
  clickResource: (resourceId: string, amount?: number) => void
  setJobAssignment: (jobId: string, assignedCount: number) => void
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
  logs: [],
  unreadLogCount: 0,

  tick: () => {
    set((gameStore) => {
      const { gameState, events } = engineTick(gameStore.gameState)
  
      let newLogs = gameStore.logs
      let unreadDelta = 0
  
      for (const event of events) {
        if (event.type === 'death') {
          newLogs = addLog(newLogs, {
            timestamp: Date.now(),
            type: 'death',
            message: `有 ${event.count} 只小狗死于饥荒`,
            count: event.count,
          })
          unreadDelta += 1
        }
      }
  
      return {
        gameState,
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

  clickResource: (resourceId: string, amount: number = 1) => {
    set((gameStore) => ({
      gameState: clickResource(gameStore.gameState, resourceId, amount),
    }))
  },

  setJobAssignment: (jobId: string, assignedCount: number) => {
    set((gameStore) => ({
      gameState: setJobAssignment(gameStore.gameState, jobId, assignedCount),
    }))
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
      logs: [],
      unreadLogCount: 0,
    }))
  },

  resetGame: () => {
    resetGame()
    set(() => ({
      gameState: createInitialGameState(),
      logs: [],
      unreadLogCount: 0,
    }))
  },
}))
