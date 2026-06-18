import 'fake-indexeddb/auto'
import { db } from './db'

test('база открывается и таблица recipes пуста', async () => {
  await db.open()
  const count = await db.recipes.count()
  expect(count).toBe(0)
})
