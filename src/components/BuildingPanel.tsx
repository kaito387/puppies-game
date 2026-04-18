import { useGameStore } from '@/store/gameStore'
import { BUILDINGS } from '@/engine/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function BuildingPanel() {
  const gameState = useGameStore((store) => store.gameState)
  const getUnlockedBuildingIds = useGameStore((store) => store.getUnlockedBuildingIds)
  const unlockedBuildingIds = getUnlockedBuildingIds()
  const buildBuilding = useGameStore((store) => store.buildBuilding)
  const clickResource = useGameStore((store) => store.clickResource)
  const getBuildingCost = useGameStore((store) => store.getBuildingCost)
  const canBuildBuilding = useGameStore((store) => store.canBuildBuilding)

  return (
    <Card>
      <CardHeader>
        <CardTitle>🏡 小镇</CardTitle>
        <CardDescription>建造基础设施，扩展你的产能与容量。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-md border p-3">
          <Button size="sm" onClick={() => clickResource('food', 2)}>🍖 采集浆果</Button>
          <span className="text-xs text-muted-foreground">手动采集基础资源。</span>
        </div>

        <Separator />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {BUILDINGS.filter((building) => unlockedBuildingIds.includes(building.id)).map((building) => {
            const count = gameState.buildings[building.id] || 0
            const buildingCost = getBuildingCost(building.id)
            const canBuild = canBuildBuilding(building.id)

            const costText = Object.entries(buildingCost)
              .map(([resourceId, cost]) => `${cost} ${resourceId}`)
              .join(' + ')

            return (
              <div key={building.id} className="rounded-md border p-3">
                <div className="space-y-1.5">
                  <div className="font-medium leading-none">
                    {building.icon} {building.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{building.description}</div>
                  <div className="text-xs text-muted-foreground">花费: {costText}</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" onClick={() => buildBuilding(building.id)} disabled={!canBuild}>
                    建造
                  </Button>
                  <Badge variant="outline">已有 {count}</Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
