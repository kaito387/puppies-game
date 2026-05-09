import { useGameStore } from '@/store/gameStore'

export function Calendar() {
  const getCalendar = useGameStore((state) => state.getCalendar)
  const calendar = getCalendar()

  if (!calendar) return null

  const seasonText = {
    spring: '春季',
    summer: '夏季',
    autumn: '秋季',
    winter: '冬季'
  }[calendar.season] || '春季'

  return (
    <span className="text-sm text-muted-foreground">
      {calendar.year} 年 {calendar.month} 月 {calendar.day} 日 {seasonText}
      </span>
  )
}