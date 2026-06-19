import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { db } from './db'
import { seedRecipesIfEmpty } from './seed'
import type { Recipe } from './types'

beforeEach(async () => {
  localStorage.clear()
  await db.recipes.clear()
  await db.categories.clear()
})

const mkRecipe = (id: string): Recipe => ({
  id, title: 'Моё', category: '', tags: [], ingredients: [], steps: [],
  rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false,
  createdAt: 1, updatedAt: 1,
})

test('предустанавливает рецепты на пустом устройстве при первом заходе', async () => {
  await seedRecipesIfEmpty()
  expect(await db.recipes.count()).toBeGreaterThan(60)
  expect(localStorage.getItem('recipes-seeded-v1')).toBe('1')
})

test('предустановленные рецепты имеют updatedAt=1 (облако приоритетнее)', async () => {
  await seedRecipesIfEmpty()
  const all = await db.recipes.toArray()
  expect(all.every((r) => r.updatedAt === 1)).toBe(true)
})

test('не трогает уже существующие рецепты пользователя', async () => {
  await db.recipes.add(mkRecipe('x'))
  await seedRecipesIfEmpty()
  expect(await db.recipes.count()).toBe(1)
  expect(localStorage.getItem('recipes-seeded-v1')).toBe('1')
})

test('не сеет повторно, если флаг уже стоит', async () => {
  localStorage.setItem('recipes-seeded-v1', '1')
  await seedRecipesIfEmpty()
  expect(await db.recipes.count()).toBe(0)
})
