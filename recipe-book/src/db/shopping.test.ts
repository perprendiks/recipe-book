import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { db } from './db'
import { addItemsFromRecipe, getShoppingList, addManualItem, toggleItem, removeItem, clearChecked } from './shopping'
import type { Recipe } from './types'

const recipe = { id: 'r1', title: 'Тест', category: '', tags: [], ingredients: [{ name: 'Мука', amount: 200, unit: 'г' }, { name: 'Соль', amount: null, unit: '' }], steps: [], rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false, createdAt: 1, updatedAt: 1 } as Recipe

beforeEach(async () => { await db.shopping.clear() })

test('addItemsFromRecipe добавляет ингредиенты', async () => {
  const n = await addItemsFromRecipe(recipe)
  expect(n).toBe(2)
  expect((await getShoppingList()).length).toBe(2)
})
test('toggleItem переключает, clearChecked удаляет вычеркнутые', async () => {
  await addItemsFromRecipe(recipe)
  const list = await getShoppingList()
  await toggleItem(list[0].id)
  await clearChecked()
  expect((await getShoppingList()).length).toBe(1)
})
test('addManualItem и removeItem', async () => {
  await addManualItem('Хлеб')
  const list = await getShoppingList()
  expect(list[0].name).toBe('Хлеб')
  await removeItem(list[0].id)
  expect((await getShoppingList()).length).toBe(0)
})
