import { type GameState, createInitialGameState } from '@/engine/types'

const SAVE_KEY = 'puppies-game-save'

export function saveGame(gameState: GameState): void {
  const saveData = {
    version: '0.0.0',
    timestamp: Date.now(),
    ...gameState,
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
}

export function loadGame(): GameState {
  const INITIAL_GAME_STATE = createInitialGameState()

  const saveDataStr = localStorage.getItem(SAVE_KEY)
  if (!saveDataStr) {
    return INITIAL_GAME_STATE
  }

  try {
    const saveData = JSON.parse(saveDataStr)

    return {
      resourceCounts: saveData.resourceCounts || INITIAL_GAME_STATE.resourceCounts,
      resourceLimits: saveData.resourceLimits || INITIAL_GAME_STATE.resourceLimits,
      buildings: saveData.buildings || INITIAL_GAME_STATE.buildings,
      jobAssignments: saveData.jobAssignments || INITIAL_GAME_STATE.jobAssignments,
      populationGrowthProgress:
        saveData.populationGrowthProgress ?? INITIAL_GAME_STATE.populationGrowthProgress,
      tickCount: saveData.tickCount ?? INITIAL_GAME_STATE.tickCount,
      lastTickTime: saveData.lastTickTime ?? INITIAL_GAME_STATE.lastTickTime,
    }
  } catch (error) {
    console.error('加载存档失败：', error)
    return INITIAL_GAME_STATE
  }
}

export function resetGame(): void {
  localStorage.removeItem(SAVE_KEY)
}
