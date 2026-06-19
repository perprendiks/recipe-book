import { supabase } from './supabase'
import { getCurrentUser } from '../auth/auth'
import { exportBackup, importBackup, type BackupFile } from './backup'
import { db } from './db'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

let status: SyncStatus = 'idle'
const listeners = new Set<(s: SyncStatus) => void>()
function setStatus(s: SyncStatus) { status = s; listeners.forEach((l) => l(s)) }
export function getSyncStatus(): SyncStatus { return status }
export function onSyncStatus(cb: (s: SyncStatus) => void): () => void {
  listeners.add(cb); cb(status); return () => listeners.delete(cb)
}

// Уведомление UI: локальные данные обновились извне (после загрузки из облака),
// чтобы открытые экраны перечитали список, а не показывали старое.
const dataListeners = new Set<() => void>()
export function onDataChanged(cb: () => void): () => void {
  dataListeners.add(cb); return () => dataListeners.delete(cb)
}
export function notifyDataChanged() { dataListeners.forEach((l) => l()) }

export async function localMaxUpdatedAt(): Promise<number> {
  const all = await db.recipes.toArray()
  return all.reduce((m, r) => Math.max(m, r.updatedAt), 0)
}

export async function pushBackup(): Promise<void> {
  const user = await getCurrentUser()
  if (!supabase || !user) return
  if (typeof navigator !== 'undefined' && !navigator.onLine) { setStatus('offline'); return }
  setStatus('syncing')
  try {
    const data = await exportBackup()
    const { error } = await supabase.from('backups').upsert({ user_id: user.id, data, updated_at: new Date().toISOString() })
    setStatus(error ? 'error' : 'synced')
  } catch { setStatus('error') }
}

// Пока применяем данные из облака — глушим авто-синхронизацию,
// иначе запись из pull снова дёрнет Dexie-хуки и уйдёт лишний push (цикл).
let applyingRemote = false
export function isApplyingRemote(): boolean { return applyingRemote }

// Выполнить запись в БД, не вызывая авто-синхронизацию (для предустановки рецептов).
export async function suppressSync<T>(fn: () => Promise<T>): Promise<T> {
  applyingRemote = true
  try { return await fn() } finally { applyingRemote = false }
}

export async function pullBackup(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!supabase || !user) return false
  setStatus('syncing')
  try {
    const { data, error } = await supabase.from('backups').select('data').eq('user_id', user.id).maybeSingle()
    if (error) { setStatus('error'); return false }
    if (!data) { setStatus('synced'); return false }
    applyingRemote = true
    try { await importBackup(data.data as BackupFile, 'replace') }
    finally { applyingRemote = false }
    setStatus('synced')
    notifyDataChanged()
    return true
  } catch { setStatus('error'); return false }
}

export async function syncOnLogin(): Promise<void> {
  const user = await getCurrentUser()
  if (!supabase || !user) return
  try {
    const { data } = await supabase.from('backups').select('updated_at').eq('user_id', user.id).maybeSingle()
    const cloudTime = data?.updated_at ? new Date(data.updated_at).getTime() : 0
    const localTime = await localMaxUpdatedAt()
    if (cloudTime > localTime || localTime === 0) await pullBackup()
    else await pushBackup()
  } catch { setStatus('error') }
}

let timer: ReturnType<typeof setTimeout> | undefined
export function scheduleSync(): void {
  if (applyingRemote) return
  clearTimeout(timer)
  timer = setTimeout(() => { void pushBackup() }, 3000)
}
