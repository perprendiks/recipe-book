import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { db } from './db'
import { addRecipe, getRecipe, getAllRecipes, updateRecipe, deleteRecipe, toggleFavorite, RecipeInput } from './recipes'

const base: RecipeInput = {
  title: 'Борщ', category: 'Супы', tags: ['обед'],
  ingredients: [{ name: 'Свёкла', amount: 2, unit: 'шт' }],
  steps: [{ text: 'Сварить' }],
  rating: 0, timeMinutes: 60, servings: 4, notes: '', isFavorite: false,
}

beforeEach(async () => {
  await db.recipes.clear()
})

test('addRecipe создаёт рецепт с id и метками времени', async () => {
  const r = await addRecipe(base)
  expect(r.id).toBeTruthy()
  expect(r.createdAt).toBeGreaterThan(0)
  expect(r.updatedAt).toBe(r.createdAt)
  expect(await getRecipe(r.id)).toMatchObject({ title: 'Борщ' })
})

test('getAllRecipes возвращает все рецепты', async () => {
  await addRecipe(base)
  await addRecipe({ ...base, title: 'Окрошка' })
  const all = await getAllRecipes()
  expect(all).toHaveLength(2)
})

test('updateRecipe меняет поля и обновляет updatedAt', async () => {
  const r = await addRecipe(base)
  await updateRecipe(r.id, { title: 'Борщ красный' })
  const updated = await getRecipe(r.id)
  expect(updated!.title).toBe('Борщ красный')
  expect(updated!.updatedAt).toBeGreaterThanOrEqual(r.updatedAt)
})

test('deleteRecipe удаляет рецепт', async () => {
  const r = await addRecipe(base)
  await deleteRecipe(r.id)
  expect(await getRecipe(r.id)).toBeUndefined()
})

test('toggleFavorite переключает избранное', async () => {
  const r = await addRecipe(base)
  await toggleFavorite(r.id)
  expect((await getRecipe(r.id))!.isFavorite).toBe(true)
  await toggleFavorite(r.id)
  expect((await getRecipe(r.id))!.isFavorite).toBe(false)
})

test('getAllRecipes возвращает рецепты в порядке убывания по updatedAt', async () => {
  const r1 = await addRecipe(base)
  // Принудительно создаём разницу во времени обновления
  await new Promise(r => setTimeout(r, 2))
  const r2 = await addRecipe({ ...base, title: 'Окрошка' })
  // Обновляем первый рецепт, чтобы его updatedAt стал больше
  await updateRecipe(r1.id, { title: 'Борщ обновленный' })

  const all = await getAllRecipes()
  expect(all).toHaveLength(2)
  // Первый в массиве должен быть с большим updatedAt (самый свежий)
  expect(all[0].id).toBe(r1.id)
  expect(all[0].title).toBe('Борщ обновленный')
  expect(all[1].id).toBe(r2.id)
})

test('toggleFavorite и updateRecipe no-op на несуществующем id без ошибок', async () => {
  // Проверяем toggleFavorite на несуществующий id
  await expect(toggleFavorite('nonexistent-id')).resolves.toBeUndefined()

  // Проверяем updateRecipe на несуществующий id
  await expect(updateRecipe('nonexistent-id', { title: 'Новое имя' })).resolves.toBeUndefined()

  // Убедимся, что БД осталась неизменной (пуста или с теми же рецептами)
  const all = await getAllRecipes()
  expect(all).toHaveLength(0)
})
