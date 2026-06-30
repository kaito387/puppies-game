import { useEffect, useRef } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { useGameStore } from '@/store/gameStore'
import { ResourcePanel } from '@/components/ResourcePanel'
import { BuildingPanel } from '@/components/BuildingPanel'
import { DogManagementPanel } from '@/components/DogManagementPanel'
import { TechnologyPanel } from '@/components/TechnologyPanel'
import { WorkshopPanel } from '@/components/WorkshopPanel'
import { LogPanel } from '@/components/LogPanel'
import { SettingsPanel } from '@/components/SettingsPanel'
import { AUTO_SAVE_INTERVAL_TICKS, GAME_TICK_INTERVAL_MS } from '@/engine/constants'
import { calculateCalendarProgress } from '@/engine/calendar'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { PolicyPanel } from '@/components/PolicyPanel'
import { getPopulationCount } from '@/engine/dogs'
import { Badge } from '@/components/ui/badge'
import {
  BoxesIcon,
  CalendarDaysIcon,
  FlaskConicalIcon,
  HammerIcon,
  HomeIcon,
  PawPrintIcon,
  Settings2Icon,
  ScrollTextIcon,
} from 'lucide-react'

function App() {
  const tick = useGameStore((store) => store.tick)
  const saveGame = useGameStore((store) => store.saveGame)
  const gameState = useGameStore((store) => store.gameState)
  const calendar = calculateCalendarProgress(gameState)
  const gameTickRef = useRef(0)
  const population = getPopulationCount(gameState.dogs)

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
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex flex-col gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3">
            <div className="flex items-center gap-2">
              <PawPrintIcon data-icon="inline-start" />
              <h1 className="text-xl font-semibold">狗国建设者</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">第 {calendar.year} 年</Badge>
              <Badge variant="outline">
                狗口 {population}/{gameState.populationCap}
              </Badge>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <ResourcePanel />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div>
                <h2 className="text-lg font-semibold">狗狗帝国控制台</h2>
                <p className="text-sm text-muted-foreground">建造、分工、研究与制度调整。</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">
                <CalendarDaysIcon data-icon="inline-start" />
                {calendar.month} 月 {calendar.day} 日
              </Badge>
              <Calendar />
              <Badge variant="outline">5 tick/s</Badge>
              <LogPanel />
              <SettingsPanel />
            </div>
          </div>
        </header>
        <div className="px-4 py-4">
          <Tabs defaultValue="buildings" className="gap-4">
            <TabsList variant="line" className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="buildings">
                <HomeIcon data-icon="inline-start" />
                建筑
              </TabsTrigger>
              <TabsTrigger value="management">
                <PawPrintIcon data-icon="inline-start" />
                管理
              </TabsTrigger>
              <TabsTrigger value="technologies">
                <FlaskConicalIcon data-icon="inline-start" />
                科技
              </TabsTrigger>
              <TabsTrigger value="workshop">
                <HammerIcon data-icon="inline-start" />
                工坊
              </TabsTrigger>
              <TabsTrigger value="policies">
                <ScrollTextIcon data-icon="inline-start" />
                政策
              </TabsTrigger>
            </TabsList>
            <TabsContent value="buildings">
              <BuildingPanel />
            </TabsContent>
            <TabsContent value="management">
              <DogManagementPanel />
            </TabsContent>
            <TabsContent value="technologies">
              <TechnologyPanel />
            </TabsContent>
            <TabsContent value="workshop">
              <WorkshopPanel />
            </TabsContent>
            <TabsContent value="policies">
              <PolicyPanel />
            </TabsContent>
          </Tabs>

          <Card size="sm" className="mt-4">
            <CardContent className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <BoxesIcon data-icon="inline-start" />
              游戏会自动保存到浏览器存储。
              <Settings2Icon data-icon="inline-start" />
              设置中可以手动保存、读取或重置。
            </CardContent>
          </Card>
        </div>
      </SidebarInset>

      <Toaster richColors position="top-center" />
    </SidebarProvider>
  )
}

export default App
