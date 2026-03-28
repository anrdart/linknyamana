import { useState, useEffect, useCallback } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2 } from 'lucide-react'
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
      } catch (err) {
        console.error('Error saving progress:', err)
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
        <div className="space-y-2">
          {WORDPRESS_SETUP_STEPS.map((step, index) => {
            const isChecked = completedTasks.includes(index)
            const isSaving = saving === index

            return (
              <label
                key={index}
                className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50"
              >
                <div className="relative">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => handleToggle(index)}
                    disabled={isSaving}
                    className={isChecked ? 'border-emerald-500 bg-emerald-500 text-white' : ''}
                  />
                  {isSaving && (
                    <Loader2 className="absolute -right-5 top-0 h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm ${
                      isChecked
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground'
                    }`}
                  >
                    {index + 1}. {step}
                  </span>
                </div>
              </label>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
