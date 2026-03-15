import { useEffect, useRef } from 'react'
import { useGameStore } from './store/gameStore'
import { ResourcePanel } from './components/ResourcePanel'
import { BuildingPanel } from './components/BuildingPanel'
import { AUTO_SAVE_INTERVAL_TICKS, GAME_TICK_INTERVAL_MS } from './engine/constants'

function App() {
  const tick = useGameStore((store) => store.tick)
  const gameState = useGameStore((store) => store.gameState)
  const saveGame = useGameStore((store) => store.saveGame)
  const resetGame = useGameStore((store) => store.resetGame)
  const gameTickRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      tick()
      gameTickRef.current += 1

      if (gameTickRef.current % AUTO_SAVE_INTERVAL_TICKS === 0) {
        saveGame()
      }
    }, GAME_TICK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [tick, saveGame])

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'sans-serif',
      }}
    >
      <h1>🐕 狗国建设者</h1>
      <p style={{ color: '#666' }}>一款增量游戏。建造狗舍和农场，扩展你的狗狗帝国！</p>

      {/* 调试信息 */}
      <div style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
        Ticks: {gameState.tickCount} | TPS: ~5
      </div>

      {/* 主要 UI */}
      <ResourcePanel />
      <BuildingPanel />

      {
        <button onClick={resetGame} style={{ marginLeft: '8px', padding: '8px 16px' }}>
          🔄 重置游戏
        </button>
      }

      {/* 底部信息 */}
      <div
        style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
          fontSize: '12px',
        }}
      >
        💾 游戏自动保存到浏览器存储
      </div>
    </div>
  )
}

export default App
