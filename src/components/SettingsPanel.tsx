import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/gameStore'
import type { ChangeEvent } from 'react'
import { Settings2 } from 'lucide-react'
import { SAVE_KEY } from '@/engine/save'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
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
          toast.success('存档导入成功')
        } catch {
          toast.error('导入失败：存档文件格式不正确')
        }
      }
    }
    reader.readAsText(file)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="游戏设置">
          <Settings2 className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-96 p-4 gap-4 flex flex-col">
        <SheetHeader className="py-4 border-b">
          <SheetTitle>⚙️ 游戏设置</SheetTitle>
        </SheetHeader>
        <Button variant="outline" asChild className="w-full">
        <label className="block cursor-pointer text-center">
          导入存档
          <input type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImport} />
        </label>
        </Button>
        <Button variant="outline" onClick={handleExport} className="w-full">导出存档</Button>
        <Button variant="destructive" onClick={resetGame} className="w-full">重置游戏</Button>
      </SheetContent>
    </Sheet>
  )
}