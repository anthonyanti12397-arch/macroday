'use client'

import { useEffect, useState } from 'react'
import { getTodayUsage } from '@/lib/storage'
import { FREE_DAILY_LIMIT } from '@/lib/constants'
import { Zap, AlertTriangle } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

export default function UsageCounter() {
  const { lang } = useLang()
  const [count, setCount] = useState(0)

  useEffect(() => { setCount(getTodayUsage().count) }, [])

  const remaining = FREE_DAILY_LIMIT - count
  const atLimit = remaining <= 0
  const lastOne = remaining === 1

  const label = lang === 'zh' ? '每日免費生成' : 'Free daily recipes'
  const remainingText = lang === 'zh'
    ? atLimit ? '今日已用完' : lastOne ? '最後 1 次！' : `還剩 ${remaining} 次`
    : atLimit ? 'Limit reached' : lastOne ? 'Last one!' : `${remaining} left`

  const color = atLimit ? 'text-red-500' : lastOne ? 'text-amber-500' : 'text-slate-500'
  const bg = atLimit ? 'bg-red-50 border-red-100' : lastOne ? 'bg-amber-50 border-amber-100' : ''
  const iconColor = atLimit ? 'text-red-500' : lastOne ? 'text-amber-500' : 'text-[#0F9E75]'
  const iconBg = atLimit ? 'bg-red-50' : lastOne ? 'bg-amber-50' : 'bg-[#E8F5F0]'
  const barColor = atLimit ? 'bg-red-400' : lastOne ? 'bg-amber-400' : 'bg-gradient-to-r from-[#0F9E75] to-[#0BD68A]'
  const pct = Math.min(100, (count / FREE_DAILY_LIMIT) * 100)

  return (
    <div className={`card p-3.5 flex items-center gap-3 ${bg}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {lastOne || atLimit
          ? <AlertTriangle size={15} className={iconColor} />
          : <Zap size={15} className={iconColor} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-600">{label}</span>
          <span className={`text-xs font-bold ${color}`}>{remainingText}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
