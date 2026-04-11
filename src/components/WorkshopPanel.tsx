import { useGameStore } from '@/store/gameStore'
import { WORKSHOP_UNLOCKS } from '@/engine/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function WorkshopPanel() {
  const gameState = useGameStore((store) => store.gameState)
  const getVisibleWorkshopUnlockIds = useGameStore((store) => store.getVisibleWorkshopUnlockIds)
  const canUnlock = useGameStore((store) => store.canUnlockWorkshopItem)
  const unlockWorkshopItem = useGameStore((store) => store.unlockWorkshopItem)

  const visibleUnlockIds = getVisibleWorkshopUnlockIds()
  const workshopBuilt = (gameState.buildings.workshop || 0) > 0

  if (!workshopBuilt) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🛠️ 工坊项目</CardTitle>
          <CardDescription>先建造至少 1 座工坊，才能制造工具与装备。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (visibleUnlockIds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🛠️ 工坊项目</CardTitle>
          <CardDescription>当前暂无可解锁项目。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🛠️ 工坊项目</CardTitle>
        <CardDescription>工坊项目为一次性永久解锁，可解锁职业与玩法分支。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">已解锁 {gameState.workshopUnlockIds.length}</Badge>
          <Badge variant="outline">工坊数量 {gameState.buildings.workshop || 0}</Badge>
        </div>

        <Separator />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleUnlockIds.map((unlockId) => {
            const unlock = WORKSHOP_UNLOCKS.find((item) => item.id === unlockId)
            if (!unlock) {
              return null
            }

            const unlocked = gameState.workshopUnlockIds.includes(unlock.id)
            const unlockable = canUnlock(unlock.id)
            const costText = Object.entries(unlock.cost)
              .map(([resourceId, amount]) => `${amount} ${resourceId}`)
              .join(' + ')

            return (
              <div key={unlock.id} className="rounded-md border p-3">
                <div className="space-y-1.5">
                  <div className="font-medium leading-none">{unlock.name}</div>
                  <div className="text-xs text-muted-foreground">{unlock.description}</div>
                  <div className="text-xs text-muted-foreground">花费: {costText}</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" disabled={unlocked || !unlockable} onClick={() => unlockWorkshopItem(unlock.id)}>
                    {unlocked ? '已解锁' : '解锁'}
                  </Button>
                  {unlocked ? <Badge variant="outline">永久</Badge> : null}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
