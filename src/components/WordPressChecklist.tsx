import { useState, useEffect, useCallback, useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, Circle } from 'lucide-react'
import { WORDPRESS_SETUP_STEPS } from '@/data/domains'

interface WordPressChecklistProps {
  domainName: string
  initialTasks?: number[]
  onProgressChange?: (domainName: string, completedTasks: number[]) => void
}

export function WordPressChecklist({ domainName, initialTasks, onProgressChange }: WordPressChecklistProps) {
  const [completedTasks, setCompletedTasks] = useState<number[]>(initialTasks ?? [])
  const [saving, setSaving] = useState<number | null>(null)

  const totalSteps = WORDPRESS_SETUP_STEPS.length
  const progressPercent = totalSteps > 0 ? Math.round((completedTasks.length / totalSteps) * 100) : 0

  const completedSet = useMemo(() => new Set(completedTasks), [completedTasks])

  const groupedSteps = useMemo(() => {
    const groups: Record<string, typeof WORDPRESS_SETUP_STEPS[number][]> = {}
    for (const step of WORDPRESS_SETUP_STEPS) {
      if (!groups[step.category]) groups[step.category] = []
      groups[step.category].push(step)
    }
    return groups
  }, [])

  useEffect(() => {
    setCompletedTasks(initialTasks ?? [])
  }, [initialTasks])

  const handleToggle = useCallback(
    async (stepIndex: number) => {
      const newCompleted = completedTasks.includes(stepIndex)
        ? completedTasks.filter((i) => i !== stepIndex)
        : [...completedTasks, stepIndex]

      setCompletedTasks(newCompleted)
      setSaving(stepIndex)

      try {
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain_name: domainName,
            completed_tasks: newCompleted,
          }),
        })
        if (res.ok) {
          onProgressChange?.(domainName, newCompleted)
        }
      } catch {
        setCompletedTasks(completedTasks)
      } finally {
        setSaving(null)
      }
    },
    [completedTasks, domainName, onProgressChange]
  )

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {completedTasks.length} of {totalSteps} completed
          </span>
          <span className="font-semibold">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {Object.entries(groupedSteps).map(([category, steps]) => {
            const globalIndices = steps.map(
              (s) => WORDPRESS_SETUP_STEPS.indexOf(s)
            )
            const doneCount = globalIndices.filter((i) => completedSet.has(i)).length

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs font-medium">
                    {category}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {doneCount}/{steps.length}
                  </span>
                </div>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="w-8 px-2 py-1.5 text-center font-medium">#</th>
                        <th className="w-8 px-1 py-1.5"></th>
                        <th className="px-2 py-1.5 text-left font-medium">Tugas</th>
                        <th className="px-2 py-1.5 text-left font-medium hidden sm:table-cell">Lokasi Menu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {steps.map((step) => {
                        const idx = WORDPRESS_SETUP_STEPS.indexOf(step)
                        const isChecked = completedSet.has(idx)
                        const isSaving = saving === idx

                        return (
                          <tr
                            key={idx}
                            className="border-b last:border-b-0 transition-colors hover:bg-accent/30 cursor-pointer"
                            onClick={() => handleToggle(idx)}
                          >
                            <td className="px-2 py-1.5 text-center text-muted-foreground">
                              {idx + 1}
                            </td>
                            <td className="px-1 py-1.5 text-center">
                              <div className="relative inline-flex">
                                {isSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                ) : isChecked ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                                )}
                              </div>
                            </td>
                            <td className={`px-2 py-1.5 ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                              {step.task}
                            </td>
                            <td className="px-2 py-1.5 text-muted-foreground hidden sm:table-cell">
                              {step.location}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
