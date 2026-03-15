import { create } from 'zustand'
import { type GameState, createInitialGameState } from '../engine/types'
import { tick } from '../engine/gameLoop'
import { buildBuilding, clickResource } from '../engine/actions'
import { saveGame, loadGame, resetGame } from '../engine/save'

interface GameStore {
  gameState: GameState

  tick: () => void

  buildBuilding: (buildingId: string) => void
  clickResource: (resourceId: string, amount?: number) => void

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

  clickResource: (resourceId: string, amount: number = 1) => {
    set((gameStore) => ({
      gameState: clickResource(gameStore.gameState, resourceId, amount),
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
