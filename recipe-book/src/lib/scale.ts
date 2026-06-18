import type { Ingredient } from '../db/types'

export function formatAmount(n: number): string {
  return Number(n.toFixed(2)).toString()
}

export function scaleIngredients(ingredients: Ingredient[], factor: number): Ingredient[] {
  return ingredients.map((i) =>
    i.amount == null ? i : { ...i, amount: Number((i.amount * factor).toFixed(2)) },
  )
}
