import { TECHNOLOGIES, type GameState, createInitialGameState } from '@/engine/types'

export const SAVE_KEY = 'puppies-game-save'

export function saveGame(gameState: GameState): void {
  const knownTechIds = new Set(TECHNOLOGIES.map((technology) => technology.id))
  const researchedTechIds = gameState.researchedTechIds.filter((techId) => knownTechIds.has(techId))

  const saveData = {
    version: '0.0.0',
    timestamp: Date.now(),
    ...gameState,
    researchedTechIds,
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

    return {
      resourceCounts: mergeRecord(saveData.resourceCounts, INITIAL_GAME_STATE.resourceCounts),
      resourceLimits: mergeRecord(saveData.resourceLimits, INITIAL_GAME_STATE.resourceLimits),
      resourceDeltaPerTick: mergeRecord(
        saveData.resourceDeltaPerTick,
        INITIAL_GAME_STATE.resourceDeltaPerTick,
      ),
      buildings: mergeRecord(saveData.buildings, INITIAL_GAME_STATE.buildings),
      jobAssignments: mergeRecord(saveData.jobAssignments, INITIAL_GAME_STATE.jobAssignments),
      researchedTechIds,
      population: saveData.population ?? INITIAL_GAME_STATE.population,
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
