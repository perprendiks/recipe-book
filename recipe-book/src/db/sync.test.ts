import 'fake-indexeddb/auto'
import { describe, expect, test, vi, beforeEach } from 'vitest'

const { upsert, maybeSingle, mockFrom } = vi.hoisted(() => {
  const upsert = vi.fn().mockResolvedValue({ error: null })
  const maybeSingle = vi.fn()
  const mockFrom = vi.fn(() => ({
    upsert,
    select: () => ({ eq: () => ({ maybeSingle }) }),
  }))
  return { upsert, maybeSingle, mockFrom }
})

vi.mock('./supabase', () => ({ supabase: { from: mockFrom }, isCloudConfigured: () => true }))
vi.mock('../auth/auth', () => ({ getCurrentUser: vi.fn().mockResolvedValue({ id: 'u1', email: 'a@b.c' }) }))

import { pushBackup, pullBackup } from './sync'
import { db } from './db'
import { addRecipe } from './recipes'

beforeEach(async () => { await db.recipes.clear(); vi.clearAllMocks(); upsert.mockResolvedValue({ error: null }) })

test('pushBackup отправляет upsert с данными пользователя', async () => {
  await addRecipe({ title: 'Борщ', category: 'Супы', tags: [], ingredients: [], steps: [], rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false })
  await pushBackup()
  expect(upsert).toHaveBeenCalledTimes(1)
  const arg = upsert.mock.calls[0][0]
  expect(arg.user_id).toBe('u1')
  expect(arg.data.recipes.length).toBe(1)
})

test('pullBackup восстанавливает рецепты из облака', async () => {
  maybeSingle.mockResolvedValue({ data: { data: { version: 1, exportedAt: 1, recipes: [{ id: 'r1', title: 'Импорт', category: '', tags: [], ingredients: [], steps: [], rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false, createdAt: 1, updatedAt: 1 }], categories: [] } }, error: null })
  const ok = await pullBackup()
  expect(ok).toBe(true)
  expect((await db.recipes.toArray()).length).toBe(1)
})

test('pullBackup возвращает false если в облаке пусто', async () => {
  maybeSingle.mockResolvedValue({ data: null, error: null })
  expect(await pullBackup()).toBe(false)
})
