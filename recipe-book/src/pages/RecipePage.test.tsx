import 'fake-indexeddb/auto'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { beforeEach, expect, test } from 'vitest'
import RecipePage from './RecipePage'
import { db } from '../db/db'
import { addRecipe } from '../db/recipes'

beforeEach(async () => { await db.recipes.clear() })

test('показывает рецепт по id', async () => {
  const r = await addRecipe({
    title: 'Плов', category: 'Горячее', tags: [],
    ingredients: [{ name: 'Рис', amount: 300, unit: 'г' }],
    steps: [{ text: 'Обжарить' }],
    rating: 5, timeMinutes: 90, servings: 6, notes: '', isFavorite: false,
  })
  render(
    <MemoryRouter initialEntries={[`/recipe/${r.id}`]}>
      <Routes><Route path="/recipe/:id" element={<RecipePage />} /></Routes>
    </MemoryRouter>,
  )
  await waitFor(() => expect(screen.getByText('Плов')).toBeInTheDocument())
  expect(screen.getByText(/Рис/)).toBeInTheDocument()
  expect(screen.getByText(/Обжарить/)).toBeInTheDocument()
})
