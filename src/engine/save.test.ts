import { beforeEach, describe, expect, it } from 'vitest'
import { loadGame, resetGame, saveGame } from '@/engine/save'
import { createInitialGameState } from '@/engine/initialState'
import { createDogs } from '@/engine/dogs'

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
        resourceCounts: { food: 10, wood: 1 },
        resourceLimits: { food: 100, wood: 100 },
        buildings: { barn: 1, farm: 0, warehouse: 0 },
        jobAssignments: { farmer: 1, hunter: 0 },
        tickCount: 10,
        lastTickTime: 12345,
      }),
    )

    const loaded = loadGame()
    expect(loaded.dogs).toEqual([])
    expect(loaded.populationCap).toBe(1)
    expect(loaded.isDomesticateEnabled).toBe(false)
    expect(loaded.populationGrowthProgress).toBe(0)
  })

  it('should load old saves without resource delta fields', () => {
    localStorage.setItem(
      'puppies-game-save',
      JSON.stringify({
        version: '0.0.0',
        resourceCounts: { food: 10, wood: 1 },
        resourceLimits: { food: 100, wood: 100 },
        buildings: { barn: 1, farm: 0, warehouse: 0 },
        jobAssignments: { farmer: 1, hunter: 0 },
        tickCount: 10,
        lastTickTime: 12345,
      }),
    )

    const loaded = loadGame()
    expect(loaded.resourceCounts.food).toBe(10)
    expect(loaded.resourceCounts.wood).toBe(1)
  })

  it('should preserve population/domestication related fields', () => {
    const state = createInitialGameState()
    state.dogs = createDogs(3)
    state.populationCap = 7
    state.isDomesticateEnabled = true
    state.populationGrowthProgress = -0.55
    saveGame(state)
    const loaded = loadGame()

    expect(loaded.dogs).toHaveLength(3)
    expect(loaded.populationCap).toBe(7)
    expect(loaded.isDomesticateEnabled).toBe(true)
    expect(loaded.populationGrowthProgress).toBeCloseTo(-0.55)
  })

  it('should persist researched technologies', () => {
    const state = createInitialGameState()
    state.researchedTechIds = ['woodworking']

    saveGame(state)
    const loaded = loadGame()

    expect(loaded.researchedTechIds).toEqual(['woodworking'])
  })

  it('should filter unknown researched technologies while loading', () => {
    localStorage.setItem(
      'puppies-game-save',
      JSON.stringify({
        version: '0.0.0',
        researchedTechIds: ['woodworking', 'unknown-tech'],
      }),
    )

    const loaded = loadGame()
    expect(loaded.researchedTechIds).toEqual(['woodworking'])
  })

  it('should persist workshop unlocks', () => {
    const state = createInitialGameState()
    state.workshopUnlockIds = ['wood_pickaxe']

    saveGame(state)
    const loaded = loadGame()

    expect(loaded.workshopUnlockIds).toEqual(['wood_pickaxe'])
  })

  it('should filter unknown workshop unlock IDs while loading', () => {
    localStorage.setItem(
      'puppies-game-save',
      JSON.stringify({
        version: '0.0.0',
        workshopUnlockIds: ['wood_pickaxe', 'unknown-unlock'],
      }),
    )

    const loaded = loadGame()
    expect(loaded.workshopUnlockIds).toEqual(['wood_pickaxe'])
  })

  it('should persist and reload buildingActiveCounts correctly', () => {
    const state = createInitialGameState()
    state.buildings.smelter = 2
    state.buildingActiveCounts.smelter = 2
    saveGame(state)

    const loaded = loadGame()
    expect(loaded.buildingActiveCounts.smelter).toBe(2)
  })

  it('should default buildingActiveCounts to initial value when missing from old save', () => {
    const oldSave = {
      version: '0.0.0',
      resourceCounts: { food: 10 },
      buildings: { smelter: 1 },
      tickCount: 5,
      lastTickTime: 12345,
      // buildingActiveCounts intentionally absent
    }
    localStorage.setItem('puppies-game-save', JSON.stringify(oldSave))

    const loaded = loadGame()
    expect(loaded.buildingActiveCounts).toBeDefined()
    expect(loaded.buildingActiveCounts.smelter ?? 0).toBe(0)
  })

  // ---- Trade / Embassy save migration tests ----

  it('should persist discoveredAnimals and embassyLevels', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit', 'bear']
    state.embassyLevels = { rabbit: 3, bear: 0 }
    saveGame(state)

    const loaded = loadGame()
    expect(loaded.discoveredAnimals).toEqual(['rabbit', 'bear'])
    expect(loaded.embassyLevels).toEqual({ rabbit: 3, bear: 0 })
  })

  it('should default discoveredAnimals to empty array when missing from old save', () => {
    const oldSave = {
      version: '0.0.0',
      resourceCounts: { food: 10 },
      buildings: { barn: 1 },
      tickCount: 5,
      lastTickTime: 12345,
      // discoveredAnimals intentionally absent
    }
    localStorage.setItem('puppies-game-save', JSON.stringify(oldSave))

    const loaded = loadGame()
    expect(loaded.discoveredAnimals).toEqual([])
  })

  it('should default embassyLevels to empty object when missing from old save', () => {
    const oldSave = {
      version: '0.0.0',
      resourceCounts: { food: 10 },
      buildings: { barn: 1 },
      tickCount: 5,
      lastTickTime: 12345,
      // embassyLevels intentionally absent
    }
    localStorage.setItem('puppies-game-save', JSON.stringify(oldSave))

    const loaded = loadGame()
    expect(loaded.embassyLevels).toEqual({})
  })

  it('should persist empty trade fields correctly', () => {
    const state = createInitialGameState()
    // default: empty discoveredAnimals, empty embassyLevels
    saveGame(state)

    const loaded = loadGame()
    expect(loaded.discoveredAnimals).toEqual([])
    expect(loaded.embassyLevels).toEqual({})
    expect(loaded.tickCount).toBe(0)
  })

  it('should survive full save/load cycle with trade data intact', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit', 'bear', 'fox', 'eagle']
    state.embassyLevels = { rabbit: 15, bear: 10, fox: 5, eagle: 0 }
    state.resourceCounts.food = 5000
    saveGame(state)

    const loaded = loadGame()
    expect(loaded.discoveredAnimals).toEqual(['rabbit', 'bear', 'fox', 'eagle'])
    expect(loaded.embassyLevels.rabbit).toBe(15)
    expect(loaded.embassyLevels.bear).toBe(10)
    expect(loaded.embassyLevels.fox).toBe(5)
    expect(loaded.embassyLevels.eagle).toBe(0)
    expect(loaded.resourceCounts.food).toBe(5000)
  })

  it('should preserve discovered animal IDs loaded from string-only array', () => {
    const oldSave = {
      version: '0.0.0',
      resourceCounts: { food: 10 },
      buildings: { farm: 1 },
      tickCount: 1,
      lastTickTime: 12345,
      discoveredAnimals: ['rabbit', 'fox'],
    }
    localStorage.setItem('puppies-game-save', JSON.stringify(oldSave))

    const loaded = loadGame()
    expect(loaded.discoveredAnimals).toEqual(['rabbit', 'fox'])
  })

  it('should recover gracefully from corrupted save data', () => {
    localStorage.setItem('puppies-game-save', '{invalid json')

    const loaded = loadGame()
    // Should return initial state without throwing
    const initial = createInitialGameState()
    expect(loaded.discoveredAnimals).toEqual(initial.discoveredAnimals)
    expect(loaded.embassyLevels).toEqual(initial.embassyLevels)
    expect(loaded.resourceCounts.food).toBe(0)
  })
})