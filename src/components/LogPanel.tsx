import { useGameStore } from '@/store/gameStore'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LogsIcon } from 'lucide-react'
import { useState } from 'react'
import type { GameLog } from '@/engine/types'

function LogItem({ log }: { log: GameLog }) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'death':
        return '💀'
      case 'building_constructed':
        return '🏗️'
      case 'tech_researched':
        return '📚'
      default:
        return '📝'
    }
  }

  return (
    <div className="border-b px-4 py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getLogIcon(log.type)}</span>
            <span className="text-sm font-medium text-foreground">{log.message}</span>
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">{formatTime(log.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}

export function LogPanel() {
  const logs = useGameStore((store) => store.logs)
  const unreadLogCount = useGameStore((store) => store.unreadLogCount)
  const markLogsAsRead = useGameStore((store) => store.markLogsAsRead)
  const [open, setOpen] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      markLogsAsRead()
    }
    setOpen(newOpen)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <LogsIcon className="size-5" />
          {unreadLogCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 size-5 flex items-center justify-center p-0 text-xs">
              {unreadLogCount > 99 ? '99+' : unreadLogCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-96 p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>📖 游戏日志</SheetTitle>
          <SheetDescription>
            查看游戏过程中发生的重要事件记录
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1">
          {logs.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              暂无日志记录
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <LogItem key={log.id} log={log} />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
