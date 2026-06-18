import 'fake-indexeddb/auto'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, test } from 'vitest'
import SettingsPage from './SettingsPage'
import { db } from '../db/db'
import { getAllRecipes } from '../db/recipes'

beforeEach(async () => { await db.recipes.clear(); await db.categories.clear() })

test('импорт файла бэкапа добавляет рецепты', async () => {
  const backup = {
    version: 1, exportedAt: Date.now(),
    recipes: [{ id: 'r1', title: 'Компот', category: 'Напитки', tags: [], ingredients: [], steps: [], rating: 0, timeMinutes: 20, servings: 4, notes: '', isFavorite: false, createdAt: 1, updatedAt: 1 }],
    categories: [],
  }
  render(<MemoryRouter><SettingsPage /></MemoryRouter>)
  const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' })
  await userEvent.upload(screen.getByLabelText('Загрузить файл бэкапа'), file)
  await waitFor(async () => expect(await getAllRecipes()).toHaveLength(1))
})

test('импорт некорректного JSON файла показывает ошибку', async () => {
  render(<MemoryRouter><SettingsPage /></MemoryRouter>)
  const file = new File(['this is not json'], 'bad.json', { type: 'application/json' })
  await userEvent.upload(screen.getByLabelText('Загрузить файл бэкапа'), file)
  await screen.findByText(/Ошибка/)
  expect(await getAllRecipes()).toHaveLength(0)
})

test('с чекбоксом "Заменить" импорт заменяет существующие рецепты', async () => {
  const { addRecipe } = await import('../db/recipes')
  await addRecipe({
    title: 'Старый рецепт', category: 'Супы', tags: [], ingredients: [], steps: [],
    rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false,
  })
  expect(await getAllRecipes()).toHaveLength(1)

  const backup = {
    version: 1, exportedAt: Date.now(),
    recipes: [{ id: 'new-1', title: 'Новый рецепт', category: 'Салаты', tags: [], ingredients: [], steps: [], rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false, createdAt: 1, updatedAt: 1 }],
    categories: [],
  }

  render(<MemoryRouter><SettingsPage /></MemoryRouter>)
  const checkbox = screen.getByLabelText('Заменить всю коллекцию')
  await userEvent.click(checkbox)

  const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' })
  await userEvent.upload(screen.getByLabelText('Загрузить файл бэкапа'), file)

  await waitFor(async () => {
    const all = await getAllRecipes()
    expect(all).toHaveLength(1)
    expect(all[0].title).toBe('Новый рецепт')
  })
})
