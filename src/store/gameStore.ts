import { create } from 'zustand'
import { type GameState, createInitialGameState } from '@/engine/types'
import { tick } from '@/engine/gameLoop'
import { clickResource, setDomesticateEnabled, setJobAssignment } from '@/engine/actions'
import { buildBuilding, canBuildBuilding, getBuildingCost } from '@/engine/buildings'
import { saveGame, loadGame, resetGame } from '@/engine/save'

interface GameStore {
  gameState: GameState

  tick: () => void

  buildBuilding: (buildingId: string) => void
  getBuildingCost: (buildingId: string) => Record<string, number>
  canBuildBuilding: (buildingId: string) => boolean
  clickResource: (resourceId: string, amount?: number) => void
  setJobAssignment: (jobId: string, assignedCount: number) => void
  setDomesticateEnabled: (enabled: boolean) => void

  saveGame: () => void
  loadGame: () => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: loadGame(),

  tick: () => {
    set((gameStore) => ({
      gameState: tick(gameStore.gameState),
    }))
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

  saveGame: () => {
    const { gameState } = get()
    saveGame(gameState)
  },

  loadGame: () => {
    set(() => ({
      gameState: loadGame(),
    }))
  },

  resetGame: () => {
    resetGame()
    set(() => ({
      gameState: createInitialGameState(),
    }))
  },
}))
