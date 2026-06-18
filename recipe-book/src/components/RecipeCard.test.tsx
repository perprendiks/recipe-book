import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RecipeCard from './RecipeCard'
import type { Recipe } from '../db/types'

const recipe: Recipe = {
  id: 'x1', title: 'Борщ', category: 'Супы', tags: ['обед'],
  ingredients: [], steps: [], rating: 4, timeMinutes: 60, servings: 4,
  notes: '', isFavorite: false, createdAt: 1, updatedAt: 1,
}

test('карточка показывает название и ведёт на страницу рецепта', () => {
  render(<MemoryRouter><RecipeCard recipe={recipe} /></MemoryRouter>)
  expect(screen.getByText('Борщ')).toBeInTheDocument()
  expect(screen.getByRole('link')).toHaveAttribute('href', '/recipe/x1')
})
