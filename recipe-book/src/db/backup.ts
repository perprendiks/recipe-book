import { db } from './db'
import type { Recipe, Category } from './types'
import { blobToBase64, base64ToBlob } from '../lib/photo'

function normalizeRecipe(r: any): Omit<Recipe, 'photo'> & { photo?: string } {
  return {
    id: typeof r.id === 'string' && r.id ? r.id : crypto.randomUUID(),
    title: typeof r.title === 'string' ? r.title : '',
    category: typeof r.category === 'string' ? r.category : '',
    tags: Array.isArray(r.tags) ? r.tags : [],
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    steps: Array.isArray(r.steps) ? r.steps : [],
    photo: r.photo,
    rating: typeof r.rating === 'number' ? r.rating : 0,
    timeMinutes: typeof r.timeMinutes === 'number' ? r.timeMinutes : null,
    servings: typeof r.servings === 'number' ? r.servings : null,
    notes: typeof r.notes === 'string' ? r.notes : '',
    isFavorite: !!r.isFavorite,
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : Date.now(),
  }
}

export type SerializedRecipe = Omit<Recipe, 'photo'> & { photo?: string }

export interface BackupFile {
  version: 1
  exportedAt: number
  recipes: SerializedRecipe[]
  categories: Category[]
}

export async function exportBackup(): Promise<BackupFile> {
  const recipes = await db.recipes.toArray()
  const categories = await db.categories.toArray()
  const serialized: SerializedRecipe[] = await Promise.all(
    recipes.map(async (r) => {
      const { photo, ...rest } = r
      return { ...rest, photo: photo ? await blobToBase64(photo) : undefined }
    }),
  )
  return { version: 1, exportedAt: Date.now(), recipes: serialized, categories }
}

export async function importBackup(file: BackupFile, mode: 'replace' | 'merge'): Promise<void> {
  const recipes: Recipe[] = await Promise.all(
    file.recipes.map(async (s) => {
      const normalized = normalizeRecipe(s)
      const { photo, ...rest } = normalized
      return { ...rest, photo: photo ? await base64ToBlob(photo) : undefined }
    }),
  )
  await db.transaction('rw', db.recipes, db.categories, async () => {
    if (mode === 'replace') {
      await db.recipes.clear()
      await db.categories.clear()
    }
    await db.recipes.bulkPut(recipes)
    if (file.categories?.length) await db.categories.bulkPut(file.categories)
  })
}

export function parseBackupFile(text: string): BackupFile {
  const data = JSON.parse(text)
  if (data?.version !== 1 || !Array.isArray(data.recipes) || !Array.isArray(data.categories)) {
    throw new Error('Неверный формат файла бэкапа')
  }
  return data as BackupFile
}

export async function downloadBackup(): Promise<void> {
  const backup = await exportBackup()
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date(backup.exportedAt).toISOString().slice(0, 10)
  a.href = url
  a.download = `recipe-book-backup-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}
