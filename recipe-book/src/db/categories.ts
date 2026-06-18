import { db } from './db'
import type { Category } from './types'

export const DEFAULT_CATEGORIES = [
  'Супы', 'Салаты', 'Горячее', 'Гарниры', 'Выпечка', 'Десерты', 'Напитки', 'Заготовки',
]

export async function getCategories(): Promise<Category[]> {
  const cats = await db.categories.toArray()
  return cats.sort((a, b) => a.order - b.order)
}

export async function seedCategories(): Promise<void> {
  const count = await db.categories.count()
  if (count > 0) return
  await db.categories.bulkAdd(
    DEFAULT_CATEGORIES.map((name, i) => ({ id: crypto.randomUUID(), name, order: i })),
  )
}

export async function addCategory(name: string): Promise<Category> {
  const all = await db.categories.toArray()
  const order = all.length ? Math.max(...all.map(c => c.order)) + 1 : 0
  const cat: Category = { id: crypto.randomUUID(), name, order }
  await db.categories.add(cat)
  return cat
}

export async function renameCategory(id: string, name: string): Promise<void> {
  await db.categories.update(id, { name })
}

export async function deleteCategory(id: string): Promise<void> {
  await db.categories.delete(id)
}
