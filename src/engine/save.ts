import { TECHNOLOGIES, type GameState } from '@/engine/types'
import { createInitialGameState } from '@/engine/initialState'
import { WORKSHOP_UNLOCKS } from '@/engine/types'

const SAVE_KEY = 'puppies-game-save'

export function saveGame(gameState: GameState): void {
  const knownTechIds = new Set(TECHNOLOGIES.map((technology) => technology.id))
  const researchedTechIds = gameState.researchedTechIds.filter((techId) => knownTechIds.has(techId))
  const knownWorkshopUnlockIds = new Set(WORKSHOP_UNLOCKS.map((unlock) => unlock.id))
  const workshopUnlockIds = gameState.workshopUnlockIds.filter((unlockId) => knownWorkshopUnlockIds.has(unlockId))

  const saveData = {
    version: '0.0.0',
    timestamp: Date.now(),
    ...gameState,
    researchedTechIds,
    workshopUnlockIds,
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

    const mergeRecord = (
      savedRecord: Record<string, number> | undefined,
      defaultRecord: Record<string, number>,
    ): Record<string, number> => ({
      ...defaultRecord,
      ...(savedRecord || {}),
    })

    const knownTechIds = new Set(TECHNOLOGIES.map((technology) => technology.id))
    const researchedTechIds = Array.isArray(saveData.researchedTechIds)
      ? saveData.researchedTechIds.filter((techId: unknown) => typeof techId === 'string' && knownTechIds.has(techId))
      : INITIAL_GAME_STATE.researchedTechIds
    const knownWorkshopUnlockIds = new Set(WORKSHOP_UNLOCKS.map((unlock) => unlock.id))
    const workshopUnlockIds = Array.isArray(saveData.workshopUnlockIds)
      ? saveData.workshopUnlockIds.filter(
          (unlockId: unknown) => typeof unlockId === 'string' && knownWorkshopUnlockIds.has(unlockId),
        )
      : INITIAL_GAME_STATE.workshopUnlockIds

    return {
      resourceCounts: mergeRecord(saveData.resourceCounts, INITIAL_GAME_STATE.resourceCounts),
      buildings: mergeRecord(saveData.buildings, INITIAL_GAME_STATE.buildings),
      researchedTechIds,
      workshopUnlockIds,
      dogs: saveData.dogs ?? INITIAL_GAME_STATE.dogs,
      populationCap: saveData.populationCap ?? INITIAL_GAME_STATE.populationCap,
      isDomesticateEnabled:
        saveData.isDomesticateEnabled ?? INITIAL_GAME_STATE.isDomesticateEnabled,
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
