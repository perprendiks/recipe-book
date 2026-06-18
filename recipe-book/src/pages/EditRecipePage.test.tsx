import 'fake-indexeddb/auto'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { beforeEach, expect, test } from 'vitest'
import EditRecipePage from './EditRecipePage'
import { db } from '../db/db'
import { getAllRecipes } from '../db/recipes'

beforeEach(async () => { await db.recipes.clear() })

test('создаёт рецепт и сохраняет в БД', async () => {
  render(
    <MemoryRouter initialEntries={['/add']}>
      <Routes>
        <Route path="/add" element={<EditRecipePage />} />
        <Route path="/recipe/:id" element={<div>Страница рецепта</div>} />
      </Routes>
    </MemoryRouter>,
  )
  await userEvent.type(screen.getByLabelText('Название'), 'Сырники')
  await userEvent.click(screen.getByText('Сохранить'))
  await waitFor(() => expect(screen.getByText('Страница рецепта')).toBeInTheDocument())
  const all = await getAllRecipes()
  expect(all).toHaveLength(1)
  expect(all[0].title).toBe('Сырники')
})
