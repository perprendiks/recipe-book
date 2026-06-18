import Dexie, { Table } from 'dexie'
import { Recipe, Category, ShoppingItem, SettingEntry } from './types'

export class RecipeDB extends Dexie {
  recipes!: Table<Recipe, string>
  categories!: Table<Category, string>
  shopping!: Table<ShoppingItem, string>
  settings!: Table<SettingEntry, string>

  constructor() {
    super('recipeBook')
    this.version(1).stores({
      recipes: 'id, title, category, isFavorite, updatedAt',
      categories: 'id, name, order',
      shopping: 'id, checked',
      settings: 'key',
    })
  }
}

export const db = new RecipeDB()
