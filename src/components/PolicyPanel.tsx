import { useGameStore } from '@/store/gameStore'
import { POLICY_GROUPS } from '@/engine/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

export function PolicyPanel() {
  const gameState = useGameStore((s) => s.gameState)
  const enactPolicy = useGameStore((s) => s.enactPolicy)
  const canEnactPolicy = useGameStore((s) => s.canEnactPolicy)
  const getPoliciesByGroup = useGameStore((s) => s.getPoliciesByGroup)

  const culture = gameState.resourceCounts.culture || 0
  const enactedPolicyIds = gameState.enactedPolicyIds || []
  const groups = getPoliciesByGroup()

  const enactedCount = enactedPolicyIds.length

  return (
    <Card className="h-[80vh] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>🎭 政策</span>
          <span className="text-sm font-normal">文化：{culture.toFixed(0)} | 已启用：{enactedCount}</span>
        </CardTitle>
        <CardDescription>每组政策只能选择一个</CardDescription>
      </CardHeader>

      <ScrollArea className="flex-1 px-6">
        <div className="space-y-6 pb-6">
          {groups.map((group, groupIndex) => {
            const groupCost = POLICY_GROUPS[groupIndex]?.cost || {}
            const cultureCost = groupCost.culture || 0

            const enactedInGroup = group.some(p => enactedPolicyIds.includes(p.id))

            return (
              <div key={`group-${groupIndex}`} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">政策组 {groupIndex + 1}</h3>
                  <Badge variant="outline">互斥</Badge>
                  <span className="text-xs text-muted-foreground">消耗：{cultureCost} 文化</span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {group.map(policy => {
                    const isEnacted = enactedPolicyIds.includes(policy.id)
                    const canDo = canEnactPolicy(policy.id)
                    const isBlocked = enactedInGroup && !isEnacted
                    const isResourceBlocked = !canDo && !isBlocked && !isEnacted

                    return (
                      <Card key={policy.id} className="relative">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex justify-between items-center">
                            <span>{policy.name}</span>
                            {isEnacted && <Badge className="bg-green-600">已启用</Badge>}
                            {!isEnacted && isBlocked && <Badge variant="destructive">已禁用（互斥）</Badge>}
                            {!isEnacted && isResourceBlocked && <Badge variant="secondary">不可用</Badge>}
                          </CardTitle>
                          <CardDescription className="text-xs">{policy.description}</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-2 text-xs">
                          {policy.effects && policy.effects.length > 0 ? (
                            <div className="text-green-600">
                              {policy.effects.map((ef, i) => (
                                <div key={i}>
                                  • {ef.type === 'job_production'
                                    ? ` ${ef.targetId} 产出 +${ef.value}`
                                    : ef.type === 'building_cost'
                                      ? `建筑费用 -${ef.value}`
                                      : `效果：${ef.type}`
                                  }
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-muted-foreground">无额外效果</div>
                          )}

                          <div className="mt-1">
                            {isEnacted ? (
                              <Button size="sm" className="w-full" disabled>已启用</Button>
                            ) : (
                              <Button
                                size="sm"
                                className="w-full"
                                disabled={!canDo || isBlocked}
                                onClick={() => enactPolicy(policy.id)}
                              >
                                启用政策
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                <Separator />
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}