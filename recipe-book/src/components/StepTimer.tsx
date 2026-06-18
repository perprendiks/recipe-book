import { useEffect, useRef, useState } from 'react'

interface Props {
  minutes: number
}

function playBeep() {
  try {
    const AudioCtx =
      typeof window !== 'undefined'
        ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
        : undefined
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
    osc.onended = () => ctx.close()
  } catch {
    // AudioContext not supported — silent fail
  }
}

export default function StepTimer({ minutes }: Props) {
  const totalSeconds = minutes * 60
  const [remaining, setRemaining] = useState(totalSeconds)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const firedRef = useRef(false)

  useEffect(() => {
    setRemaining(totalSeconds)
    setRunning(false)
    firedRef.current = false
  }, [totalSeconds])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            intervalRef.current = null
            if (!firedRef.current) {
              firedRef.current = true
              navigator.vibrate?.([200, 100, 200])
              playBeep()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running])

  function handleReset() {
    setRunning(false)
    setRemaining(totalSeconds)
    firedRef.current = false
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const done = remaining === 0

  return (
    <div className="flex flex-col items-center gap-3 py-4 px-5 bg-accent-soft/40 rounded-card border border-border">
      <span className="font-display text-5xl text-ink tabular-nums tracking-wide">
        {mm}:{ss}
      </span>
      <div className="flex gap-2">
        {!done && (
          <button
            onClick={() => setRunning((r) => !r)}
            className="btn-primary px-6 py-2.5 text-base"
          >
            {running ? 'Пауза' : 'Старт'}
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-5 py-2.5 text-base rounded-chip border border-border text-ink-soft bg-surface active:scale-95 transition-transform"
        >
          Сброс
        </button>
      </div>
      {done && (
        <span className="text-accent font-semibold text-sm">Время вышло!</span>
      )}
    </div>
  )
}
