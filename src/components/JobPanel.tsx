import { useGameStore } from '../store/gameStore'
import { JOBS } from '../engine/types'

export function JobPanel() {
  const gameState = useGameStore((store) => store.gameState)
  const setJobAssignment = useGameStore((store) => store.setJobAssignment)

  const population = Math.floor(gameState.resourceCounts.puppies || 0)
  const totalAssigned = Object.values(gameState.jobAssignments).reduce((sum, count) => sum + count, 0)
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
      <h3>👷 职业分配</h3>
      <div style={{ marginBottom: '12px', color: '#666' }}>
        总人口: {population} | 空闲: {idlePopulation}
      </div>

      {JOBS.map((job) => {
        const assigned = gameState.jobAssignments[job.id] || 0
        const canIncrease = idlePopulation > 0
        const canDecrease = assigned > 0

        return (
          <div
            key={job.id}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0' }}
          >
            <div>
              {job.icon} {job.name} - {job.description}
            </div>
            <div>
              <button disabled={!canDecrease} onClick={() => setJobAssignment(job.id, assigned - 1)}>
                -
              </button>
              <strong style={{ margin: '0 10px' }}>{assigned}</strong>
              <button disabled={!canIncrease} onClick={() => setJobAssignment(job.id, assigned + 1)}>
                +
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
