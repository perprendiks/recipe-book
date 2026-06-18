import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { db } from './db'
import { seedCategories, getCategories, addCategory, renameCategory, deleteCategory, DEFAULT_CATEGORIES } from './categories'

beforeEach(async () => {
  await db.categories.clear()
})

test('seedCategories заливает дефолтные категории в пустую таблицу', async () => {
  await seedCategories()
  const cats = await getCategories()
  expect(cats.length).toBe(DEFAULT_CATEGORIES.length)
  expect(cats[0].name).toBe(DEFAULT_CATEGORIES[0])
})

test('seedCategories не дублирует, если уже есть данные', async () => {
  await addCategory('Моё')
  await seedCategories()
  expect((await getCategories()).length).toBe(1)
})

test('seedCategories идемпотентен при конкурентных вызовах', async () => {
  // Вызываем seedCategories дважды одновременно (как React StrictMode в dev)
  await Promise.all([seedCategories(), seedCategories()])
  const cats = await getCategories()
  expect(cats.length).toBe(DEFAULT_CATEGORIES.length)
})

test('addCategory добавляет в конец', async () => {
  await addCategory('Завтраки')
  await addCategory('Ужины')
  const cats = await getCategories()
  expect(cats.map(c => c.name)).toEqual(['Завтраки', 'Ужины'])
})

test('renameCategory переименовывает', async () => {
  const c = await addCategory('Супчики')
  await renameCategory(c.id, 'Супы')
  expect((await getCategories())[0].name).toBe('Супы')
})

test('deleteCategory удаляет', async () => {
  const c = await addCategory('Лишняя')
  await deleteCategory(c.id)
  expect(await getCategories()).toHaveLength(0)
})
