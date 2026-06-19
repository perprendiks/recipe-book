import 'fake-indexeddb/auto'
import { expect, test, vi, beforeEach } from 'vitest'

// maybeSingleUpdatedAt — для select('updated_at')
// maybeSingleData      — для select('data')
const { upsert, maybeSingleUpdatedAt, maybeSingleData, mockFrom } = vi.hoisted(() => {
  const upsert = vi.fn().mockResolvedValue({ error: null })
  const maybeSingleUpdatedAt = vi.fn()
  const maybeSingleData = vi.fn()
  const mockFrom = vi.fn(() => ({
    upsert,
    select: (col: string) => ({
      eq: () => ({
        maybeSingle: col === 'updated_at' ? maybeSingleUpdatedAt : maybeSingleData,
      }),
    }),
  }))
  return { upsert, maybeSingleUpdatedAt, maybeSingleData, mockFrom }
})

vi.mock('./supabase', () => ({ supabase: { from: mockFrom }, isCloudConfigured: () => true }))
vi.mock('../auth/auth', () => ({ getCurrentUser: vi.fn().mockResolvedValue({ id: 'u1', email: 'a@b.c' }) }))

import { pushBackup, pullBackup, syncOnLogin } from './sync'
import { db } from './db'
import { addRecipe } from './recipes'
import type { BackupFile } from './backup'

beforeEach(async () => {
  await db.recipes.clear()
  vi.clearAllMocks()
  upsert.mockResolvedValue({ error: null })
})

// ── Существующие тесты ────────────────────────────────────────────────────────

test('pushBackup отправляет upsert с данными пользователя', async () => {
  await addRecipe({ title: 'Борщ', category: 'Супы', tags: [], ingredients: [], steps: [], rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false })
  await pushBackup()
  expect(upsert).toHaveBeenCalledTimes(1)
  const arg = upsert.mock.calls[0][0]
  expect(arg.user_id).toBe('u1')
  expect(arg.data.recipes.length).toBe(1)
})

test('pullBackup восстанавливает рецепты из облака', async () => {
  maybeSingleData.mockResolvedValue({ data: { data: { version: 1, exportedAt: 1, recipes: [{ id: 'r1', title: 'Импорт', category: '', tags: [], ingredients: [], steps: [], rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false, createdAt: 1, updatedAt: 1 }], categories: [] } }, error: null })
  const ok = await pullBackup()
  expect(ok).toBe(true)
  expect((await db.recipes.toArray()).length).toBe(1)
})

test('pullBackup возвращает false если в облаке пусто', async () => {
  maybeSingleData.mockResolvedValue({ data: null, error: null })
  expect(await pullBackup()).toBe(false)
})

// ── syncOnLogin: last-write-wins ──────────────────────────────────────────────

const cloudRecipe: BackupFile['recipes'][number] = {
  id: 'cloud1',
  title: 'Из облака',
  category: '',
  tags: [],
  ingredients: [],
  steps: [],
  rating: 0,
  timeMinutes: null,
  servings: null,
  notes: '',
  isFavorite: false,
  createdAt: 1,
  updatedAt: 1,
}

const cloudBackupFile: BackupFile = {
  version: 1,
  exportedAt: 1,
  recipes: [cloudRecipe],
  categories: [],
}

test('syncOnLogin: облако новее → pull (локальные данные заменяются облачными)', async () => {
  // Добавляем локальный рецепт (с маленьким updatedAt)
  await addRecipe({ title: 'Локальный', category: '', tags: [], ingredients: [], steps: [], rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false })

  // Облако «из будущего»
  const futureIso = new Date(Date.now() + 100_000).toISOString()
  maybeSingleUpdatedAt.mockResolvedValue({ data: { updated_at: futureIso }, error: null })
  maybeSingleData.mockResolvedValue({ data: { data: cloudBackupFile }, error: null })

  await syncOnLogin()

  const local = await db.recipes.toArray()
  expect(local.length).toBe(1)
  expect(local[0].id).toBe('cloud1')
})

test('syncOnLogin: локально новее → push (upsert вызван, данные на месте)', async () => {
  await addRecipe({ title: 'Свежий', category: '', tags: [], ingredients: [], steps: [], rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false })

  // Облако «из прошлого»
  const pastIso = new Date(1000).toISOString()
  maybeSingleUpdatedAt.mockResolvedValue({ data: { updated_at: pastIso }, error: null })

  await syncOnLogin()

  expect(upsert).toHaveBeenCalledTimes(1)
  const local = await db.recipes.toArray()
  expect(local.length).toBe(1)
  expect(local[0].title).toBe('Свежий')
})

test('syncOnLogin: локально пусто (localTime=0) → pull (облачный рецепт появляется)', async () => {
  // БД пуста
  const anyIso = new Date(5000).toISOString()
  maybeSingleUpdatedAt.mockResolvedValue({ data: { updated_at: anyIso }, error: null })
  maybeSingleData.mockResolvedValue({ data: { data: cloudBackupFile }, error: null })

  await syncOnLogin()

  const local = await db.recipes.toArray()
  expect(local.length).toBe(1)
  expect(local[0].id).toBe('cloud1')
})
