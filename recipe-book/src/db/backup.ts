import { db } from './db'
import { Recipe, Category } from './types'
import { blobToBase64, base64ToBlob } from '../lib/photo'

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
      const { photo, ...rest } = s
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
  if (data?.version !== 1 || !Array.isArray(data.recipes)) {
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
