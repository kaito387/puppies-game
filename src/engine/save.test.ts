import { beforeEach, describe, expect, it } from 'vitest'
import { loadGame, resetGame, saveGame } from '@/engine/save'
import { createInitialGameState } from '@/engine/types'

function createMemoryStorage(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

describe('Save System', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    })
    resetGame()
  })

  it('should default missing populationGrowthProgress from old saves', () => {
    localStorage.setItem(
      'puppies-game-save',
      JSON.stringify({
        version: '0.0.0',
        resourceCounts: { puppies: 2, food: 10, bones: 1 },
        resourceLimits: { puppies: 3, food: 100, bones: 100 },
        buildings: { barn: 1, farm: 0, warehouse: 0 },
        jobAssignments: { farmer: 1, hunter: 0 },
        tickCount: 10,
        lastTickTime: 12345,
      }),
    )

    const loaded = loadGame()
    expect(loaded.populationGrowthProgress).toBe(0)
    expect(loaded.resourceCounts.puppies).toBe(2)
  })

  it('should preserve signed populationGrowthProgress values', () => {
    const state = createInitialGameState()
    state.populationGrowthProgress = -0.55

    saveGame(state)
    const loaded = loadGame()

    expect(loaded.populationGrowthProgress).toBeCloseTo(-0.55)
  })
})
