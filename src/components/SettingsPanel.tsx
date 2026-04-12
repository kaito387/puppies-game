import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGameStore } from '@/store/gameStore'
import type { ChangeEvent } from 'react'
import { SAVE_KEY } from '@/engine/save'

export function SettingsPanel() {
  const resetGame = useGameStore((store) => store.resetGame)
  const saveGame = useGameStore((store) => store.saveGame)
  const loadGame = useGameStore((store) => store.loadGame)

  // 导出存档 
  const handleExport = () => {
    saveGame()
    const data = localStorage.getItem(SAVE_KEY)
    if (data) {
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'puppies-game-save.json'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // 导入存档
  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (text) {
        try {
          const data = JSON.parse(text)
          if (!data || typeof data !== 'object' || !('resourceCounts' in data)) {
            throw new Error('存档格式不正确')
          }
          localStorage.setItem(SAVE_KEY, text)
          loadGame()
          window.location.reload()
        } catch {
          window.alert('导入失败：存档文件格式不正确')
        }
      }
    }
    reader.readAsText(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>设置</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Button variant="outline" asChild className="w-full">
            <label className="w-full block cursor-pointer text-center">
              导入存档
              <input type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImport} />
            </label>
          </Button>
          <Button variant="outline" onClick={handleExport} className="w-full">导出存档</Button>
          <Button variant="destructive" onClick={resetGame} className="w-full">重置游戏</Button>
        </div>
      </CardContent>
    </Card>
  )
}
