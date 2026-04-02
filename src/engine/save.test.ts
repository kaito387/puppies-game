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

  it('should default missing population fields from old saves', () => {
    localStorage.setItem(
      'puppies-game-save',
      JSON.stringify({
        version: '0.0.0',
        resourceCounts: { food: 10, bones: 1 },
        resourceLimits: { food: 100, bones: 100 },
        buildings: { barn: 1, farm: 0, warehouse: 0 },
        jobAssignments: { farmer: 1, hunter: 0 },
        tickCount: 10,
        lastTickTime: 12345,
      }),
    )

    const loaded = loadGame()
    expect(loaded.population).toBe(0)
    expect(loaded.populationCap).toBe(1)
    expect(loaded.isDomesticateEnabled).toBe(false)
    expect(loaded.populationGrowthProgress).toBe(0)
  })

  it('should default missing resourceDeltaPerTick from old saves', () => {
    localStorage.setItem(
      'puppies-game-save',
      JSON.stringify({
        version: '0.0.0',
        resourceCounts: { food: 10, bones: 1 },
        resourceLimits: { food: 100, bones: 100 },
        buildings: { barn: 1, farm: 0, warehouse: 0 },
        jobAssignments: { farmer: 1, hunter: 0 },
        tickCount: 10,
        lastTickTime: 12345,
      }),
    )

    const loaded = loadGame()
    expect(loaded.resourceDeltaPerTick).toEqual({ food: 0, bones: 0 })
  })

  it('should preserve population/domestication related fields', () => {
    const state = createInitialGameState()
    state.population = 3
    state.populationCap = 7
    state.isDomesticateEnabled = true
    state.populationGrowthProgress = -0.55
    state.resourceDeltaPerTick.food = 1.25

    saveGame(state)
    const loaded = loadGame()

    expect(loaded.population).toBe(3)
    expect(loaded.populationCap).toBe(7)
    expect(loaded.isDomesticateEnabled).toBe(true)
    expect(loaded.populationGrowthProgress).toBeCloseTo(-0.55)
    expect(loaded.resourceDeltaPerTick.food).toBeCloseTo(1.25)
  })
})
