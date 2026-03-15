import { useGameStore } from '../store/gameStore'
import { RESOURCES } from '../engine/types'

export function ResourcePanel() {
  const gameState = useGameStore((store) => store.gameState)

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
        return (
          <div key={resource.id} style={{ margin: '8px 0', fontSize: '18px' }}>
            {resource.icon} {resource.name}: <strong>{amount.toFixed(0)}</strong>
          </div>
        )
      })}
    </div>
  )
}
