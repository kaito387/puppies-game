import { useGameStore } from '../store/gameStore'
import { RESOURCES } from '../engine/types'

export function ResourcePanel() {
  const gameState = useGameStore((store) => store.gameState)
  const population = Math.floor(gameState.resourceCounts.puppies || 0)
  const growthProgress = Math.floor((gameState.populationGrowthProgress || 0) * 100)
  const populationCap = Math.floor(gameState.resourceLimits.puppies || 0)
  const totalAssigned = Object.values(gameState.jobAssignments).reduce((sum, count) => sum + count, 0)  // should we calculate total assigned puppies in ResourcePanel or JobPanel? --- IGNORE ---
  const idlePopulation = population - totalAssigned

  return (
    <div
      style={{
        padding: '16px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        marginBottom: '16px',
        backgroundColor: '#f9f9f9',
      }}
    >
      <h3>📦 资源</h3>

      {RESOURCES.map((resource) => {
        const amount = gameState.resourceCounts[resource.id] || 0
        const limit = gameState.resourceLimits[resource.id] || 0
        return (
          <div key={resource.id} style={{ margin: '8px 0', fontSize: '18px' }}>
            {resource.icon} {resource.name}: <strong>{amount.toFixed(0)}</strong> / {limit.toFixed(0)}
          </div>
        )
      })}

      <div style={{ marginTop: '12px', color: '#555' }}>
        人口: {population}/{populationCap} | 在岗: {totalAssigned} | 空闲: {idlePopulation} | 增长进度: {growthProgress}%
      </div>
    </div>
  )
}
