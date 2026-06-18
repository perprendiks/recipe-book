import { db } from './db'
import type { Recipe, ShoppingItem } from './types'

export async function addItemsFromRecipe(recipe: Recipe): Promise<number> {
  const items: ShoppingItem[] = recipe.ingredients.map((ing) => ({
    id: crypto.randomUUID(),
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
    checked: false,
    fromRecipeId: recipe.id,
  }))
  await db.shopping.bulkAdd(items)
  return items.length
}

export async function getShoppingList(): Promise<ShoppingItem[]> {
  const all = await db.shopping.toArray()
  return all.sort((a, b) => {
    if (a.checked === b.checked) return 0
    return a.checked ? 1 : -1
  })
}

export async function addManualItem(name: string): Promise<void> {
  const item: ShoppingItem = {
    id: crypto.randomUUID(),
    name,
    amount: null,
    unit: '',
    checked: false,
  }
  await db.shopping.add(item)
}

export async function toggleItem(id: string): Promise<void> {
  const item = await db.shopping.get(id)
  if (item) await db.shopping.update(id, { checked: !item.checked })
}

export async function removeItem(id: string): Promise<void> {
  await db.shopping.delete(id)
}

export async function clearChecked(): Promise<void> {
  const all = await db.shopping.toArray()
  const checkedIds = all.filter((i) => i.checked).map((i) => i.id)
  await db.shopping.bulkDelete(checkedIds)
}
