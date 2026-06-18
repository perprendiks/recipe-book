import { db } from './db'
import { Recipe } from './types'

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>

export async function addRecipe(data: RecipeInput): Promise<Recipe> {
  const now = Date.now()
  const recipe: Recipe = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
  await db.recipes.add(recipe)
  return recipe
}

export function getRecipe(id: string): Promise<Recipe | undefined> {
  return db.recipes.get(id)
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const all = await db.recipes.toArray()
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function updateRecipe(id: string, patch: Partial<RecipeInput>): Promise<void> {
  await db.recipes.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteRecipe(id: string): Promise<void> {
  await db.recipes.delete(id)
}

export async function toggleFavorite(id: string): Promise<void> {
  const r = await db.recipes.get(id)
  if (r) await db.recipes.update(id, { isFavorite: !r.isFavorite, updatedAt: Date.now() })
}
