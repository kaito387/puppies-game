import { create } from 'zustand'
import { type GameState, createInitialGameState } from '@/engine/types'
import { tick } from '@/engine/gameLoop'
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

interface GameStore {
  gameState: GameState

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
