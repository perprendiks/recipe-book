import { useEffect, useState } from 'react'
import { onSyncStatus, type SyncStatus as Status } from '../db/sync'

// Ненавязчивый индикатор состояния синхронизации с облаком.
const VIEW: Record<Status, { text: string; cls: string } | null> = {
  idle: null,
  syncing: { text: 'Сохраняю в облако…', cls: 'bg-accent-soft text-accent' },
  synced: { text: '✓ Сохранено в облаке', cls: 'bg-success/10 text-success' },
  offline: { text: 'Нет сети — сохранится позже', cls: 'bg-surface-sunk text-ink-soft' },
  error: { text: 'Не удалось синхронизировать', cls: 'bg-danger/10 text-danger' },
}

export default function SyncStatus() {
  const [status, setStatus] = useState<Status>('idle')
  useEffect(() => onSyncStatus(setStatus), [])

  const view = VIEW[status]
  if (!view) return null
  return <p className={`text-sm rounded-chip px-3 py-2 ${view.cls}`}>{view.text}</p>
}
