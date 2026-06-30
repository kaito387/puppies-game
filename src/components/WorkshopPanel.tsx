import { useGameStore } from '@/store/gameStore'
import { WORKSHOP_UNLOCKS } from '@/engine/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { describeEffect, formatResourceList } from '@/engine/formatters'
import { CheckIcon, HammerIcon } from 'lucide-react'

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
          <CardTitle>工坊项目</CardTitle>
          <CardDescription>先建造至少 1 座工坊，才能制造工具与装备。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (visibleUnlockIds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>工坊项目</CardTitle>
          <CardDescription>当前暂无可解锁项目。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>工坊项目</CardTitle>
        <CardDescription>工坊项目为一次性永久解锁，可解锁职业与玩法分支。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
            const costText = formatResourceList(unlock.cost)

            return (
              <div
                key={unlock.id}
                className="flex min-h-44 flex-col justify-between gap-3 rounded-md border bg-card p-3"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium leading-none">{unlock.name}</div>
                    {unlocked ? <Badge variant="default">永久</Badge> : null}
                  </div>
                  <div className="text-xs text-muted-foreground">{unlock.description}</div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">花费 {costText}</Badge>
                    {unlock.effects?.map((effect) => (
                      <Badge key={effect.id} variant="outline">
                        {describeEffect(effect)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={unlocked || !unlockable}
                    onClick={() => unlockWorkshopItem(unlock.id)}
                  >
                    {unlocked ? (
                      <CheckIcon data-icon="inline-start" />
                    ) : (
                      <HammerIcon data-icon="inline-start" />
                    )}
                    {unlocked ? '已解锁' : '解锁'}
                  </Button>
                  {!unlocked && !unlockable ? <Badge variant="outline">资源不足</Badge> : null}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
