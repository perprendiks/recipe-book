import { expect, test } from 'vitest'
import { scaleIngredients, formatAmount } from './scale'
import type { Ingredient } from '../db/types'

const ings: Ingredient[] = [
  { name: 'Мука', amount: 200, unit: 'г' },
  { name: 'Соль', amount: null, unit: '' },
]
test('scaleIngredients умножает числовые amount, null не трогает', () => {
  const r = scaleIngredients(ings, 2)
  expect(r[0].amount).toBe(400)
  expect(r[1].amount).toBeNull()
})
test('scaleIngredients округляет дробные', () => {
  expect(scaleIngredients([{ name: 'X', amount: 100, unit: 'г' }], 0.333)[0].amount).toBe(33.3)
})
test('formatAmount убирает хвостовые нули', () => {
  expect(formatAmount(2)).toBe('2')
  expect(formatAmount(2.5)).toBe('2.5')
  expect(formatAmount(33.30)).toBe('33.3')
})
