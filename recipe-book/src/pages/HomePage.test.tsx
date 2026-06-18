import 'fake-indexeddb/auto'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, test } from 'vitest'
import HomePage from './HomePage'
import { db } from '../db/db'
import { addRecipe } from '../db/recipes'
import { seedCategories } from '../db/categories'

const mk = (title: string, fav = false) => ({
  title, category: 'Супы', tags: [], ingredients: [], steps: [],
  rating: 0, timeMinutes: 10, servings: 1, notes: '', isFavorite: fav,
})

beforeEach(async () => {
  await db.recipes.clear()
  await db.categories.clear()
  await seedCategories()
})

test('показывает рецепты и фильтрует по поиску', async () => {
  await addRecipe(mk('Борщ'))
  await addRecipe(mk('Окрошка'))
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  await waitFor(() => expect(screen.getByText('Борщ')).toBeInTheDocument())
  await userEvent.type(screen.getByPlaceholderText('Поиск рецептов'), 'окро')
  await waitFor(() => expect(screen.queryByText('Борщ')).not.toBeInTheDocument())
  expect(screen.getByText('Окрошка')).toBeInTheDocument()
})

test('фильтрует рецепты по категории', async () => {
  await addRecipe({ ...mk('Борщ'), category: 'Супы' })
  await addRecipe({ ...mk('Тирамису'), category: 'Десерты' })
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  await waitFor(() => expect(screen.getByText('Борщ')).toBeInTheDocument())
  expect(screen.getByText('Тирамису')).toBeInTheDocument()

  await userEvent.click(screen.getByText('Десерты'))
  await waitFor(() => expect(screen.queryByText('Борщ')).not.toBeInTheDocument())
  expect(screen.getByText('Тирамису')).toBeInTheDocument()
})

test('фильтрует рецепты по избранному', async () => {
  await addRecipe(mk('Любимое', true))
  await addRecipe(mk('Обычное', false))
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  await waitFor(() => expect(screen.getByText('Любимое')).toBeInTheDocument())
  expect(screen.getByText('Обычное')).toBeInTheDocument()

  const checkbox = screen.getByRole('checkbox', { name: 'Только избранное' })
  await userEvent.click(checkbox)
  await waitFor(() => expect(screen.queryByText('Обычное')).not.toBeInTheDocument())
  expect(screen.getByText('Любимое')).toBeInTheDocument()
})
