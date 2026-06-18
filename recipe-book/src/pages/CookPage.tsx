import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRecipe } from '../db/recipes'
import type { Recipe } from '../db/types'
import StepTimer from '../components/StepTimer'
import { parseMinutes } from '../lib/parseTime'

export default function CookPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined)
  const [stepIndex, setStepIndex] = useState(0)

  // Load recipe
  useEffect(() => {
    if (id) {
      getRecipe(id).then((r) => setRecipe(r ?? null))
    }
  }, [id])

  // Wake Lock
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    async function requestWakeLock() {
      try {
        lock = await navigator.wakeLock?.request('screen') ?? null
      } catch {
        // Wake Lock not supported or denied — silent fail
      }
    }
    requestWakeLock()
    return () => {
      lock?.release().catch(() => {})
    }
  }, [])

  function goBack() {
    navigate(`/recipe/${id}`)
  }

  if (recipe === undefined) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-ink-soft">
        Загрузка…
      </div>
    )
  }

  if (recipe === null) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3">
        <p className="font-display text-xl text-ink">Рецепт не найден</p>
        <button onClick={() => navigate('/')} className="text-accent font-semibold text-sm">
          ← К рецептам
        </button>
      </div>
    )
  }

  const steps = recipe.steps
  const total = steps.length
  const current = steps[stepIndex]
  const isLast = stepIndex === total - 1
  const isFirst = stepIndex === 0
  const timerMinutes = current ? parseMinutes(current.text) : null

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <span className="font-display text-base text-ink-soft">
          Шаг {stepIndex + 1} из {total}
        </span>
        <button
          onClick={goBack}
          aria-label="Закрыть режим готовки"
          className="grid place-items-center w-10 h-10 rounded-full bg-surface border border-border text-ink-soft text-xl active:scale-90 transition-transform"
        >
          ×
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-border mx-4 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((stepIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 gap-6">
        <h1 className="font-display text-2xl text-accent">
          {recipe.title}
        </h1>
        {current && (
          <p className="text-2xl leading-relaxed text-ink max-w-[65ch]">
            {current.text}
          </p>
        )}
        {timerMinutes !== null && (
          <StepTimer minutes={timerMinutes} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 px-4 pb-8 pt-2">
        {!isFirst && (
          <button
            onClick={() => setStepIndex((i) => i - 1)}
            className="flex-1 py-4 rounded-chip border border-border text-ink font-semibold text-lg bg-surface active:scale-[0.98] transition-transform"
          >
            ← Назад
          </button>
        )}
        {isLast ? (
          <button
            onClick={goBack}
            className="flex-1 py-4 rounded-chip bg-accent text-on-accent font-bold text-lg active:scale-[0.98] transition-transform"
          >
            Готово
          </button>
        ) : (
          <button
            onClick={() => setStepIndex((i) => i + 1)}
            className="flex-1 py-4 rounded-chip bg-accent text-on-accent font-bold text-lg active:scale-[0.98] transition-transform"
          >
            Далее →
          </button>
        )}
      </div>
    </div>
  )
}
