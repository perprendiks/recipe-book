export interface Ingredient {
  name: string
  amount: number | null   // null = «по вкусу»
  unit: string
}

export interface Step {
  text: string
  durationMin?: number     // для кнопки-таймера (Фаза 2)
}

export interface Recipe {
  id: string
  title: string
  category: string
  tags: string[]
  ingredients: Ingredient[]
  steps: Step[]
  photo?: Blob
  rating: number           // 0..5
  timeMinutes: number | null
  servings: number | null
  notes: string
  isFavorite: boolean
  createdAt: number
  updatedAt: number
}

export interface Category {
  id: string
  name: string
  order: number
}

export interface ShoppingItem {
  id: string
  name: string
  amount: number | null
  unit: string
  checked: boolean
  fromRecipeId?: string
}

export interface SettingEntry {
  key: string
  value: unknown
}
