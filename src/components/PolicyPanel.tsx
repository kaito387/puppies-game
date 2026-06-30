import { useGameStore } from '@/store/gameStore'
import { POLICY_GROUPS } from '@/engine/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { describeEffect, formatResourceList } from '@/engine/formatters'
import { CheckIcon, ScrollTextIcon } from 'lucide-react'

export function PolicyPanel() {
  const gameState = useGameStore((store) => store.gameState)
  const enactPolicy = useGameStore((store) => store.enactPolicy)
  const canEnactPolicy = useGameStore((store) => store.canEnactPolicy)
  const getPoliciesByGroup = useGameStore((store) => store.getPoliciesByGroup)
  const getVisiblePolicyGroupIds = useGameStore((store) => store.getVisiblePolicyGroupIds)

  const culture = gameState.resourceCounts.culture || 0
  const enactedPolicyIds = gameState.enactedPolicyIds || []
  const allGroups = getPoliciesByGroup()
  const visibleGroupIds = getVisiblePolicyGroupIds()
  const groups = visibleGroupIds.map((id) => allGroups[id])

  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>政策</CardTitle>
          <CardDescription>建造图书馆后会开放第一组政策。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="max-h-[80vh]">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>政策</span>
          <span className="flex flex-wrap gap-2">
            <Badge variant="outline">文化 {culture.toFixed(0)}</Badge>
            <Badge variant="outline">已启用 {enactedPolicyIds.length}</Badge>
          </span>
        </CardTitle>
        <CardDescription>每组政策互斥，只能选择一个长期方向。</CardDescription>
      </CardHeader>

      <CardContent>
        <ScrollArea className="max-h-[62vh] pr-3">
          <div className="flex flex-col gap-5 pb-2">
            {groups.map((group, index) => {
              const groupId = visibleGroupIds[index]
              const groupCost = POLICY_GROUPS[groupId]?.cost || {}
              const enactedInGroup = group.some((policy) => enactedPolicyIds.includes(policy.id))

              return (
                <section key={`group-${groupId}`} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">政策组 {groupId + 1}</h3>
                    <Badge variant="outline">互斥</Badge>
                    <Badge variant="secondary">消耗 {formatResourceList(groupCost)}</Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {group.map((policy) => {
                      const isEnacted = enactedPolicyIds.includes(policy.id)
                      const canDo = canEnactPolicy(policy.id)
                      const isBlocked = enactedInGroup && !isEnacted

                      return (
                        <div
                          key={policy.id}
                          className="flex min-h-44 flex-col justify-between gap-3 rounded-md border bg-card p-3"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="font-medium leading-none">{policy.name}</h4>
                              {isEnacted ? <Badge variant="default">已启用</Badge> : null}
                              {isBlocked ? <Badge variant="destructive">互斥锁定</Badge> : null}
                              {!isEnacted && !isBlocked && !canDo ? (
                                <Badge variant="secondary">资源不足</Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground">{policy.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {policy.effects?.length ? (
                                policy.effects.map((effect) => (
                                  <Badge key={effect.id} variant="outline">
                                    {describeEffect(effect)}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline">无额外效果</Badge>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            disabled={isEnacted || !canDo || isBlocked}
                            onClick={() => enactPolicy(policy.id)}
                          >
                            {isEnacted ? (
                              <CheckIcon data-icon="inline-start" />
                            ) : (
                              <ScrollTextIcon data-icon="inline-start" />
                            )}
                            {isEnacted ? '已启用' : '启用政策'}
                          </Button>
                        </div>
                      )
                    })}
                  </div>

                  {index < groups.length - 1 ? <Separator /> : null}
                </section>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
