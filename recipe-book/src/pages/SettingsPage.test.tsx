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
