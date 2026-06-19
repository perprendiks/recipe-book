import { db } from './db'
import { importBackup } from './backup'
import { suppressSync } from './sync'
import seedRecipes from '../data/seedRecipes'

const SEED_FLAG = 'recipes-seeded-v1'

// Предустановка рецептов при ПЕРВОМ заходе на пустом устройстве.
// Если рецепты уже есть (пользователь работает) — не трогаем.
// Если потом войти в облако со своими данными — они приоритетнее (см. updatedAt=1 у seed).
export async function seedRecipesIfEmpty(): Promise<void> {
  if (localStorage.getItem(SEED_FLAG)) return
  const count = await db.recipes.count()
  if (count > 0) { localStorage.setItem(SEED_FLAG, '1'); return }
  // Подавляем авто-синхронизацию: предустановка не должна улетать в облако
  // и затирать там реальные данные (например, у владельца на новом телефоне).
  await suppressSync(() => importBackup(seedRecipes, 'replace'))
  localStorage.setItem(SEED_FLAG, '1')
}
