import { describe, expect, it } from 'vitest'
import { runBalanceSimulation } from '@/engine/simulation'

describe('Balance Simulation', () => {
  it('should keep meaningful goals available across a seven day simulation', () => {
    const result = runBalanceSimulation({ days: 7, secondsPerDecision: 30 })

    expect(result.milestones).toHaveLength(7)
    expect(result.purchases.length).toBeGreaterThan(20)
    expect(result.finalState.researchedTechIds.length).toBeGreaterThanOrEqual(8)
    expect(result.finalState.workshopUnlockIds.length).toBeGreaterThanOrEqual(4)
    expect(result.finalState.dogs.length).toBeGreaterThan(3)

    const lastDayPurchases = result.purchases.filter((purchase) => {
      const tickText = purchase.split('@')[1]
      const tick = Number(tickText || 0)
      const finalTick = result.finalState.tickCount
      return tick >= finalTick - finalTick / 7
    })

    expect(lastDayPurchases.length).toBeGreaterThan(0)
  })
})
