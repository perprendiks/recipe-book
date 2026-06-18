import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { db } from './db'
import { addRecipe } from './recipes'
import { addCategory } from './categories'
import { exportBackup, importBackup, parseBackupFile } from './backup'

beforeEach(async () => {
  await db.recipes.clear()
  await db.categories.clear()
})

const baseRecipe = {
  title: 'Блины', category: 'Десерты', tags: ['завтрак'],
  ingredients: [{ name: 'Мука', amount: 200, unit: 'г' }],
  steps: [{ text: 'Смешать' }],
  rating: 5, timeMinutes: 30, servings: 4, notes: 'бабушкин', isFavorite: true,
}

test('exportBackup собирает рецепты и категории', async () => {
  await addRecipe(baseRecipe)
  await addCategory('Десерты')
  const backup = await exportBackup()
  expect(backup.version).toBe(1)
  expect(backup.recipes).toHaveLength(1)
  expect(backup.recipes[0].title).toBe('Блины')
  expect(backup.categories).toHaveLength(1)
})

test('exportBackup кодирует фото в data-URL строку', async () => {
  const photo = new Blob([new Uint8Array([9, 9, 9])], { type: 'image/png' })
  await addRecipe({ ...baseRecipe, photo })
  const backup = await exportBackup()
  expect(typeof backup.recipes[0].photo).toBe('string')
  expect(backup.recipes[0].photo!.startsWith('data:image/png;base64,')).toBe(true)
})

test('importBackup replace восстанавливает рецепты и фото как Blob', async () => {
  const photo = new Blob([new Uint8Array([7, 7])], { type: 'image/png' })
  await addRecipe({ ...baseRecipe, photo })
  const backup = await exportBackup()
  await db.recipes.clear()
  await importBackup(backup, 'replace')
  const all = await db.recipes.toArray()
  expect(all).toHaveLength(1)
  expect(all[0].photo).toBeInstanceOf(Blob)
})

test('parseBackupFile бросает ошибку на чужом формате', () => {
  expect(() => parseBackupFile('{"foo":1}')).toThrow()
})

test('parseBackupFile принимает валидный бэкап', async () => {
  await addRecipe(baseRecipe)
  const backup = await exportBackup()
  const parsed = parseBackupFile(JSON.stringify(backup))
  expect(parsed.recipes).toHaveLength(1)
})
