# Кулинарная книга — План реализации (Фаза 1: рабочее ядро)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Рабочее PWA-приложение «Кулинарная книга», в которое можно занести рецепты (вручную или импортом), смотреть/искать/фильтровать/редактировать/удалять их с фото, ставить оценки и избранное, делать бэкап и импорт; упакованное в устанавливаемое на айфон PWA и опубликованное на GitHub Pages.

**Architecture:** Клиентское SPA на React, без сервера. Данные — в IndexedDB (через Dexie). Бизнес-логика (хранилище, бэкап) вынесена в чистые модули и покрыта тестами. UI — функциональные React-компоненты (финальный визуал наводится позже скиллом `impeccable`). Упаковка в PWA через vite-plugin-pwa, деплой на GitHub Pages.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, React Router, Dexie.js (IndexedDB), Vitest + React Testing Library + fake-indexeddb, vite-plugin-pwa.

## Global Constraints

- Язык интерфейса: **русский**.
- Только клиент, без серверной части. Все данные — локально в браузере (IndexedDB).
- Идентификаторы записей: `crypto.randomUUID()`.
- Метки времени: миллисекунды (`Date.now()`).
- Тесты бизнес-логики и компонентов с БД используют `fake-indexeddb` (импорт `import 'fake-indexeddb/auto'` в начале теста или в setup-файле).
- Финальный визуальный стиль НЕ фиксируется в этом плане — компоненты делаются функциональными с минимальным Tailwind-оформлением; красота — этап `impeccable`.
- Частые коммиты: после каждой задачи отдельный коммит.

---

## Структура файлов

```
recipe-book/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vitest.config.ts
├── test/setup.ts
├── public/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
└── src/
    ├── main.tsx                # точка входа, роутер
    ├── App.tsx                 # layout + маршруты
    ├── index.css               # Tailwind директивы
    ├── db/
    │   ├── types.ts            # TypeScript-типы данных
    │   ├── db.ts               # Dexie база
    │   ├── recipes.ts          # CRUD рецептов
    │   ├── recipes.test.ts
    │   ├── categories.ts       # CRUD + seed категорий
    │   ├── categories.test.ts
    │   ├── backup.ts           # экспорт/импорт коллекции
    │   └── backup.test.ts
    ├── components/
    │   ├── Layout.tsx          # шапка + нижняя навигация
    │   ├── RecipeCard.tsx      # карточка в сетке
    │   ├── StarRating.tsx      # звёзды-оценка
    │   └── PhotoPicker.tsx     # выбор/превью фото
    ├── pages/
    │   ├── HomePage.tsx        # список + поиск + фильтры
    │   ├── RecipePage.tsx      # просмотр рецепта
    │   ├── EditRecipePage.tsx  # добавить/редактировать
    │   └── SettingsPage.tsx    # бэкап + категории
    └── lib/
        └── photo.ts           # утилиты base64<->Blob
```

---

## Task 1: Инициализация проекта

**Files:**
- Create: `recipe-book/package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `vitest.config.ts`, `test/setup.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: рабочее Vite+React+TS приложение; команды `npm run dev`, `npm run build`, `npm test`.

- [ ] **Step 1: Создать проект Vite (React + TS)**

Run (из `c:\codevibe\0recept`):
```bash
npm create vite@latest recipe-book -- --template react-ts
cd recipe-book
npm install
```
Expected: создана папка `recipe-book/` со стартовым шаблоном, зависимости установлены.

- [ ] **Step 2: Установить зависимости проекта**

Run (из `recipe-book/`):
```bash
npm install dexie react-router-dom
npm install -D tailwindcss@3 postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom fake-indexeddb vite-plugin-pwa
npx tailwindcss init -p
```
Expected: установлены пакеты, созданы `tailwind.config.js` и `postcss.config.js`.

- [ ] **Step 3: Настроить Tailwind**

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

`src/index.css` (заменить содержимое целиком):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Настроить Vitest**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
})
```

`test/setup.ts`:
```ts
import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
```

В `package.json` добавить в `"scripts"`: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 5: Минимальный App + точка входа**

`src/App.tsx`:
```tsx
export default function App() {
  return <h1 className="text-2xl font-bold p-4">Кулинарная книга</h1>
}
```

`src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 6: Написать smoke-тест**

`src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

test('рендерит заголовок приложения', () => {
  render(<App />)
  expect(screen.getByText('Кулинарная книга')).toBeInTheDocument()
})
```

- [ ] **Step 7: Запустить тест — должен пройти**

Run: `npm test`
Expected: PASS (1 тест).

- [ ] **Step 8: Проверить сборку**

Run: `npm run build`
Expected: сборка без ошибок, появляется папка `dist/`.

- [ ] **Step 9: Коммит**

```bash
git add -A
git commit -m "feat: инициализация проекта recipe-book (Vite+React+TS+Tailwind+Vitest)"
```

---

## Task 2: Типы данных и база Dexie

**Files:**
- Create: `src/db/types.ts`, `src/db/db.ts`
- Test: `src/db/db.test.ts`

**Interfaces:**
- Produces:
  - `interface Ingredient { name: string; amount: number | null; unit: string }`
  - `interface Step { text: string; durationMin?: number }`
  - `interface Recipe { id: string; title: string; category: string; tags: string[]; ingredients: Ingredient[]; steps: Step[]; photo?: Blob; rating: number; timeMinutes: number | null; servings: number | null; notes: string; isFavorite: boolean; createdAt: number; updatedAt: number }`
  - `interface Category { id: string; name: string; order: number }`
  - `interface ShoppingItem { id: string; name: string; amount: number | null; unit: string; checked: boolean; fromRecipeId?: string }`
  - `interface SettingEntry { key: string; value: unknown }`
  - `const db: RecipeDB` с таблицами `recipes`, `categories`, `shopping`, `settings`.

- [ ] **Step 1: Определить типы**

`src/db/types.ts`:
```ts
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
```

- [ ] **Step 2: Определить базу Dexie**

`src/db/db.ts`:
```ts
import Dexie, { Table } from 'dexie'
import { Recipe, Category, ShoppingItem, SettingEntry } from './types'

export class RecipeDB extends Dexie {
  recipes!: Table<Recipe, string>
  categories!: Table<Category, string>
  shopping!: Table<ShoppingItem, string>
  settings!: Table<SettingEntry, string>

  constructor() {
    super('recipeBook')
    this.version(1).stores({
      recipes: 'id, title, category, isFavorite, updatedAt',
      categories: 'id, name, order',
      shopping: 'id, checked',
      settings: 'key',
    })
  }
}

export const db = new RecipeDB()
```

- [ ] **Step 3: Написать тест базы**

`src/db/db.test.ts`:
```ts
import 'fake-indexeddb/auto'
import { db } from './db'

test('база открывается и таблица recipes пуста', async () => {
  await db.open()
  const count = await db.recipes.count()
  expect(count).toBe(0)
})
```

- [ ] **Step 4: Запустить тест**

Run: `npm test src/db/db.test.ts`
Expected: PASS.

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "feat: типы данных и база Dexie"
```

---

## Task 3: CRUD рецептов

**Files:**
- Create: `src/db/recipes.ts`
- Test: `src/db/recipes.test.ts`

**Interfaces:**
- Consumes: `db`, `Recipe` (Task 2).
- Produces:
  - `type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>`
  - `addRecipe(data: RecipeInput): Promise<Recipe>`
  - `getRecipe(id: string): Promise<Recipe | undefined>`
  - `getAllRecipes(): Promise<Recipe[]>` (сортировка по `updatedAt` убыв.)
  - `updateRecipe(id: string, patch: Partial<RecipeInput>): Promise<void>`
  - `deleteRecipe(id: string): Promise<void>`
  - `toggleFavorite(id: string): Promise<void>`

- [ ] **Step 1: Написать тесты**

`src/db/recipes.test.ts`:
```ts
import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { db } from './db'
import { addRecipe, getRecipe, getAllRecipes, updateRecipe, deleteRecipe, toggleFavorite, RecipeInput } from './recipes'

const base: RecipeInput = {
  title: 'Борщ', category: 'Супы', tags: ['обед'],
  ingredients: [{ name: 'Свёкла', amount: 2, unit: 'шт' }],
  steps: [{ text: 'Сварить' }],
  rating: 0, timeMinutes: 60, servings: 4, notes: '', isFavorite: false,
}

beforeEach(async () => {
  await db.recipes.clear()
})

test('addRecipe создаёт рецепт с id и метками времени', async () => {
  const r = await addRecipe(base)
  expect(r.id).toBeTruthy()
  expect(r.createdAt).toBeGreaterThan(0)
  expect(r.updatedAt).toBe(r.createdAt)
  expect(await getRecipe(r.id)).toMatchObject({ title: 'Борщ' })
})

test('getAllRecipes возвращает все рецепты', async () => {
  await addRecipe(base)
  await addRecipe({ ...base, title: 'Окрошка' })
  const all = await getAllRecipes()
  expect(all).toHaveLength(2)
})

test('updateRecipe меняет поля и обновляет updatedAt', async () => {
  const r = await addRecipe(base)
  await updateRecipe(r.id, { title: 'Борщ красный' })
  const updated = await getRecipe(r.id)
  expect(updated!.title).toBe('Борщ красный')
  expect(updated!.updatedAt).toBeGreaterThanOrEqual(r.updatedAt)
})

test('deleteRecipe удаляет рецепт', async () => {
  const r = await addRecipe(base)
  await deleteRecipe(r.id)
  expect(await getRecipe(r.id)).toBeUndefined()
})

test('toggleFavorite переключает избранное', async () => {
  const r = await addRecipe(base)
  await toggleFavorite(r.id)
  expect((await getRecipe(r.id))!.isFavorite).toBe(true)
  await toggleFavorite(r.id)
  expect((await getRecipe(r.id))!.isFavorite).toBe(false)
})
```

- [ ] **Step 2: Запустить тесты — должны упасть**

Run: `npm test src/db/recipes.test.ts`
Expected: FAIL («Cannot find module './recipes'»).

- [ ] **Step 3: Реализовать модуль**

`src/db/recipes.ts`:
```ts
import { db } from './db'
import { Recipe } from './types'

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>

export async function addRecipe(data: RecipeInput): Promise<Recipe> {
  const now = Date.now()
  const recipe: Recipe = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
  await db.recipes.add(recipe)
  return recipe
}

export function getRecipe(id: string): Promise<Recipe | undefined> {
  return db.recipes.get(id)
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const all = await db.recipes.toArray()
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function updateRecipe(id: string, patch: Partial<RecipeInput>): Promise<void> {
  await db.recipes.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteRecipe(id: string): Promise<void> {
  await db.recipes.delete(id)
}

export async function toggleFavorite(id: string): Promise<void> {
  const r = await db.recipes.get(id)
  if (r) await db.recipes.update(id, { isFavorite: !r.isFavorite, updatedAt: Date.now() })
}
```

- [ ] **Step 4: Запустить тесты — должны пройти**

Run: `npm test src/db/recipes.test.ts`
Expected: PASS (5 тестов).

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "feat: CRUD рецептов с тестами"
```

---

## Task 4: Категории (CRUD + seed)

**Files:**
- Create: `src/db/categories.ts`
- Test: `src/db/categories.test.ts`

**Interfaces:**
- Consumes: `db`, `Category` (Task 2).
- Produces:
  - `DEFAULT_CATEGORIES: string[]`
  - `seedCategories(): Promise<void>` — заливает дефолтные, только если таблица пуста
  - `getCategories(): Promise<Category[]>` (сортировка по `order`)
  - `addCategory(name: string): Promise<Category>`
  - `renameCategory(id: string, name: string): Promise<void>`
  - `deleteCategory(id: string): Promise<void>`

- [ ] **Step 1: Написать тесты**

`src/db/categories.test.ts`:
```ts
import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { db } from './db'
import { seedCategories, getCategories, addCategory, renameCategory, deleteCategory, DEFAULT_CATEGORIES } from './categories'

beforeEach(async () => {
  await db.categories.clear()
})

test('seedCategories заливает дефолтные категории в пустую таблицу', async () => {
  await seedCategories()
  const cats = await getCategories()
  expect(cats.length).toBe(DEFAULT_CATEGORIES.length)
  expect(cats[0].name).toBe(DEFAULT_CATEGORIES[0])
})

test('seedCategories не дублирует, если уже есть данные', async () => {
  await addCategory('Моё')
  await seedCategories()
  expect((await getCategories()).length).toBe(1)
})

test('addCategory добавляет в конец', async () => {
  await addCategory('Завтраки')
  await addCategory('Ужины')
  const cats = await getCategories()
  expect(cats.map(c => c.name)).toEqual(['Завтраки', 'Ужины'])
})

test('renameCategory переименовывает', async () => {
  const c = await addCategory('Супчики')
  await renameCategory(c.id, 'Супы')
  expect((await getCategories())[0].name).toBe('Супы')
})

test('deleteCategory удаляет', async () => {
  const c = await addCategory('Лишняя')
  await deleteCategory(c.id)
  expect(await getCategories()).toHaveLength(0)
})
```

- [ ] **Step 2: Запустить тесты — должны упасть**

Run: `npm test src/db/categories.test.ts`
Expected: FAIL.

- [ ] **Step 3: Реализовать модуль**

`src/db/categories.ts`:
```ts
import { db } from './db'
import { Category } from './types'

export const DEFAULT_CATEGORIES = [
  'Супы', 'Салаты', 'Горячее', 'Гарниры', 'Выпечка', 'Десерты', 'Напитки', 'Заготовки',
]

export async function getCategories(): Promise<Category[]> {
  const cats = await db.categories.toArray()
  return cats.sort((a, b) => a.order - b.order)
}

export async function seedCategories(): Promise<void> {
  const count = await db.categories.count()
  if (count > 0) return
  await db.categories.bulkAdd(
    DEFAULT_CATEGORIES.map((name, i) => ({ id: crypto.randomUUID(), name, order: i })),
  )
}

export async function addCategory(name: string): Promise<Category> {
  const all = await db.categories.toArray()
  const order = all.length ? Math.max(...all.map(c => c.order)) + 1 : 0
  const cat: Category = { id: crypto.randomUUID(), name, order }
  await db.categories.add(cat)
  return cat
}

export async function renameCategory(id: string, name: string): Promise<void> {
  await db.categories.update(id, { name })
}

export async function deleteCategory(id: string): Promise<void> {
  await db.categories.delete(id)
}
```

- [ ] **Step 4: Запустить тесты — должны пройти**

Run: `npm test src/db/categories.test.ts`
Expected: PASS (5 тестов).

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "feat: категории (CRUD + seed) с тестами"
```

---

## Task 5: Утилиты фото (base64 <-> Blob)

**Files:**
- Create: `src/lib/photo.ts`
- Test: `src/lib/photo.test.ts`

**Interfaces:**
- Produces:
  - `blobToBase64(blob: Blob): Promise<string>` — возвращает data-URL (`data:<mime>;base64,...`)
  - `base64ToBlob(dataUrl: string): Promise<Blob>`

- [ ] **Step 1: Написать тест (round-trip)**

`src/lib/photo.test.ts`:
```ts
import { expect, test } from 'vitest'
import { blobToBase64, base64ToBlob } from './photo'

test('round-trip Blob -> base64 -> Blob сохраняет данные', async () => {
  const original = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/png' })
  const dataUrl = await blobToBase64(original)
  expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true)
  const restored = await base64ToBlob(dataUrl)
  expect(restored.type).toBe('image/png')
  const bytes = new Uint8Array(await restored.arrayBuffer())
  expect(Array.from(bytes)).toEqual([1, 2, 3, 4])
})
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `npm test src/lib/photo.test.ts`
Expected: FAIL.

- [ ] **Step 3: Реализовать модуль**

`src/lib/photo.ts`:
```ts
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function base64ToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `npm test src/lib/photo.test.ts`
Expected: PASS.

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "feat: утилиты конвертации фото base64<->Blob"
```

---

## Task 6: Бэкап — экспорт/импорт коллекции

**Files:**
- Create: `src/db/backup.ts`
- Test: `src/db/backup.test.ts`

**Interfaces:**
- Consumes: `db`, `Recipe`, `Category` (Task 2), `blobToBase64`/`base64ToBlob` (Task 5).
- Produces:
  - `interface BackupFile { version: 1; exportedAt: number; recipes: SerializedRecipe[]; categories: Category[] }`
  - `type SerializedRecipe = Omit<Recipe, 'photo'> & { photo?: string }` (photo как data-URL)
  - `exportBackup(): Promise<BackupFile>`
  - `importBackup(file: BackupFile, mode: 'replace' | 'merge'): Promise<void>` — `replace` чистит таблицы перед заливкой; `merge` добавляет (id-конфликты перезаписываются)
  - `downloadBackup(): Promise<void>` — формирует файл и инициирует скачивание (в браузере)
  - `parseBackupFile(text: string): BackupFile` — парсит и валидирует JSON, бросает `Error` при несовпадении формата

- [ ] **Step 1: Написать тесты**

`src/db/backup.test.ts`:
```ts
import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { db } from './db'
import { addRecipe } from './recipes'
import { addCategory } from './categories'
import { exportBackup, importBackup, parseBackupFile } from './backup'

beforeEach(async () => {
  await db.recipes.clear()
  await db.categories.clear()
})

const baseRecipe = {
  title: 'Блины', category: 'Десерты', tags: ['завтрак'],
  ingredients: [{ name: 'Мука', amount: 200, unit: 'г' }],
  steps: [{ text: 'Смешать' }],
  rating: 5, timeMinutes: 30, servings: 4, notes: 'бабушкин', isFavorite: true,
}

test('exportBackup собирает рецепты и категории', async () => {
  await addRecipe(baseRecipe)
  await addCategory('Десерты')
  const backup = await exportBackup()
  expect(backup.version).toBe(1)
  expect(backup.recipes).toHaveLength(1)
  expect(backup.recipes[0].title).toBe('Блины')
  expect(backup.categories).toHaveLength(1)
})

test('exportBackup кодирует фото в data-URL строку', async () => {
  const photo = new Blob([new Uint8Array([9, 9, 9])], { type: 'image/png' })
  await addRecipe({ ...baseRecipe, photo })
  const backup = await exportBackup()
  expect(typeof backup.recipes[0].photo).toBe('string')
  expect(backup.recipes[0].photo!.startsWith('data:image/png;base64,')).toBe(true)
})

test('importBackup replace восстанавливает рецепты и фото как Blob', async () => {
  const photo = new Blob([new Uint8Array([7, 7])], { type: 'image/png' })
  await addRecipe({ ...baseRecipe, photo })
  const backup = await exportBackup()
  await db.recipes.clear()
  await importBackup(backup, 'replace')
  const all = await db.recipes.toArray()
  expect(all).toHaveLength(1)
  expect(all[0].photo).toBeInstanceOf(Blob)
})

test('parseBackupFile бросает ошибку на чужом формате', () => {
  expect(() => parseBackupFile('{"foo":1}')).toThrow()
})

test('parseBackupFile принимает валидный бэкап', async () => {
  await addRecipe(baseRecipe)
  const backup = await exportBackup()
  const parsed = parseBackupFile(JSON.stringify(backup))
  expect(parsed.recipes).toHaveLength(1)
})
```

- [ ] **Step 2: Запустить тесты — должны упасть**

Run: `npm test src/db/backup.test.ts`
Expected: FAIL.

- [ ] **Step 3: Реализовать модуль**

`src/db/backup.ts`:
```ts
import { db } from './db'
import { Recipe, Category } from './types'
import { blobToBase64, base64ToBlob } from '../lib/photo'

export type SerializedRecipe = Omit<Recipe, 'photo'> & { photo?: string }

export interface BackupFile {
  version: 1
  exportedAt: number
  recipes: SerializedRecipe[]
  categories: Category[]
}

export async function exportBackup(): Promise<BackupFile> {
  const recipes = await db.recipes.toArray()
  const categories = await db.categories.toArray()
  const serialized: SerializedRecipe[] = await Promise.all(
    recipes.map(async (r) => {
      const { photo, ...rest } = r
      return { ...rest, photo: photo ? await blobToBase64(photo) : undefined }
    }),
  )
  return { version: 1, exportedAt: Date.now(), recipes: serialized, categories }
}

export async function importBackup(file: BackupFile, mode: 'replace' | 'merge'): Promise<void> {
  const recipes: Recipe[] = await Promise.all(
    file.recipes.map(async (s) => {
      const { photo, ...rest } = s
      return { ...rest, photo: photo ? await base64ToBlob(photo) : undefined }
    }),
  )
  await db.transaction('rw', db.recipes, db.categories, async () => {
    if (mode === 'replace') {
      await db.recipes.clear()
      await db.categories.clear()
    }
    await db.recipes.bulkPut(recipes)
    if (file.categories?.length) await db.categories.bulkPut(file.categories)
  })
}

export function parseBackupFile(text: string): BackupFile {
  const data = JSON.parse(text)
  if (data?.version !== 1 || !Array.isArray(data.recipes)) {
    throw new Error('Неверный формат файла бэкапа')
  }
  return data as BackupFile
}

export async function downloadBackup(): Promise<void> {
  const backup = await exportBackup()
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date(backup.exportedAt).toISOString().slice(0, 10)
  a.href = url
  a.download = `recipe-book-backup-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 4: Запустить тесты — должны пройти**

Run: `npm test src/db/backup.test.ts`
Expected: PASS (5 тестов).

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "feat: бэкап (экспорт/импорт коллекции) с тестами"
```

---

## Task 7: Каркас приложения, роутинг и навигация

**Files:**
- Create: `src/components/Layout.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Create (заглушки страниц): `src/pages/HomePage.tsx`, `src/pages/RecipePage.tsx`, `src/pages/EditRecipePage.tsx`, `src/pages/SettingsPage.tsx`
- Test: `src/App.test.tsx` (обновить)

**Interfaces:**
- Consumes: `seedCategories` (Task 4).
- Produces: маршруты `/` (Home), `/recipe/:id` (Recipe), `/add` и `/edit/:id` (EditRecipe), `/settings` (Settings); `Layout` с нижней навигацией.

- [ ] **Step 1: Создать заглушки страниц**

`src/pages/HomePage.tsx`:
```tsx
export default function HomePage() {
  return <div className="p-4">Главная</div>
}
```
`src/pages/RecipePage.tsx`:
```tsx
export default function RecipePage() {
  return <div className="p-4">Рецепт</div>
}
```
`src/pages/EditRecipePage.tsx`:
```tsx
export default function EditRecipePage() {
  return <div className="p-4">Редактирование</div>
}
```
`src/pages/SettingsPage.tsx`:
```tsx
export default function SettingsPage() {
  return <div className="p-4">Настройки</div>
}
```

- [ ] **Step 2: Создать Layout с навигацией**

`src/components/Layout.tsx`:
```tsx
import { Link, Outlet, useLocation } from 'react-router-dom'

export default function Layout() {
  const { pathname } = useLocation()
  const tab = (to: string, label: string) => (
    <Link to={to} className={`flex-1 text-center py-3 text-sm ${pathname === to ? 'font-bold' : 'text-gray-500'}`}>
      {label}
    </Link>
  )
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">
      <main className="flex-1 pb-16"><Outlet /></main>
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex">
        {tab('/', 'Рецепты')}
        {tab('/add', 'Добавить')}
        {tab('/settings', 'Настройки')}
      </nav>
    </div>
  )
}
```

- [ ] **Step 3: Настроить маршруты в App + seed категорий**

`src/App.tsx`:
```tsx
import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import RecipePage from './pages/RecipePage'
import EditRecipePage from './pages/EditRecipePage'
import SettingsPage from './pages/SettingsPage'
import { seedCategories } from './db/categories'

export default function App() {
  useEffect(() => { seedCategories() }, [])
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipe/:id" element={<RecipePage />} />
        <Route path="/add" element={<EditRecipePage />} />
        <Route path="/edit/:id" element={<EditRecipePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
```

`src/main.tsx` (обернуть в BrowserRouter):
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

- [ ] **Step 4: Обновить smoke-тест (рендер с роутером)**

`src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

test('на главной видна нижняя навигация', () => {
  render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
  expect(screen.getByText('Рецепты')).toBeInTheDocument()
  expect(screen.getByText('Настройки')).toBeInTheDocument()
})
```

- [ ] **Step 5: Запустить тесты**

Run: `npm test src/App.test.tsx`
Expected: PASS.

- [ ] **Step 6: Коммит**

```bash
git add -A
git commit -m "feat: каркас приложения, роутинг и нижняя навигация"
```

---

## Task 8: Переиспользуемые компоненты (StarRating, PhotoPicker, RecipeCard)

**Files:**
- Create: `src/components/StarRating.tsx`, `src/components/PhotoPicker.tsx`, `src/components/RecipeCard.tsx`
- Test: `src/components/StarRating.test.tsx`, `src/components/RecipeCard.test.tsx`

**Interfaces:**
- Consumes: `Recipe` (Task 2).
- Produces:
  - `StarRating({ value, onChange? }: { value: number; onChange?: (v: number) => void })`
  - `PhotoPicker({ value, onChange }: { value?: Blob; onChange: (b: Blob | undefined) => void })`
  - `RecipeCard({ recipe }: { recipe: Recipe })` — кликабельная карточка-ссылка на `/recipe/:id`

- [ ] **Step 1: Тест StarRating**

`src/components/StarRating.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StarRating from './StarRating'

test('показывает оценку и вызывает onChange по клику', async () => {
  const onChange = vi.fn()
  render(<StarRating value={3} onChange={onChange} />)
  const stars = screen.getAllByRole('button')
  expect(stars).toHaveLength(5)
  await userEvent.click(stars[4])
  expect(onChange).toHaveBeenCalledWith(5)
})
```

- [ ] **Step 2: Реализовать StarRating**

`src/components/StarRating.tsx`:
```tsx
export default function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Оценка ${n}`}
          onClick={() => onChange?.(n)}
          className={`text-xl ${n <= value ? 'text-yellow-500' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Реализовать PhotoPicker**

`src/components/PhotoPicker.tsx`:
```tsx
import { useEffect, useState } from 'react'

export default function PhotoPicker({ value, onChange }: { value?: Blob; onChange: (b: Blob | undefined) => void }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!value) { setUrl(undefined); return }
    const u = URL.createObjectURL(value)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [value])
  return (
    <div className="flex flex-col gap-2">
      {url && <img src={url} alt="Фото блюда" className="w-full h-48 object-cover rounded-xl" />}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      {url && <button type="button" className="text-sm text-red-500" onClick={() => onChange(undefined)}>Удалить фото</button>}
    </div>
  )
}
```

- [ ] **Step 4: Тест RecipeCard**

`src/components/RecipeCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RecipeCard from './RecipeCard'
import { Recipe } from '../db/types'

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
```

- [ ] **Step 5: Реализовать RecipeCard**

`src/components/RecipeCard.tsx`:
```tsx
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Recipe } from '../db/types'

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!recipe.photo) return
    const u = URL.createObjectURL(recipe.photo)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [recipe.photo])
  return (
    <Link to={`/recipe/${recipe.id}`} className="block rounded-xl overflow-hidden border">
      {url
        ? <img src={url} alt={recipe.title} className="w-full h-32 object-cover" />
        : <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-3xl">🍽️</div>}
      <div className="p-2">
        <div className="font-semibold truncate">{recipe.title}</div>
        <div className="text-xs text-gray-500">
          {recipe.isFavorite ? '❤️ ' : ''}⭐ {recipe.rating} · {recipe.timeMinutes ?? '—'} мин
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 6: Запустить тесты**

Run: `npm test src/components`
Expected: PASS.

- [ ] **Step 7: Коммит**

```bash
git add -A
git commit -m "feat: компоненты StarRating, PhotoPicker, RecipeCard"
```

---

## Task 9: Главная — список, поиск, фильтры, избранное

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Test: `src/pages/HomePage.test.tsx`

**Interfaces:**
- Consumes: `getAllRecipes` (Task 3), `getCategories` (Task 4), `RecipeCard` (Task 8).
- Produces: главный экран со списком, поиском по названию, фильтром по категории и переключателем «только избранное».

- [ ] **Step 1: Написать тест**

`src/pages/HomePage.test.tsx`:
```tsx
import 'fake-indexeddb/auto'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, test } from 'vitest'
import HomePage from './HomePage'
import { db } from '../db/db'
import { addRecipe } from '../db/recipes'

const mk = (title: string, fav = false) => ({
  title, category: 'Супы', tags: [], ingredients: [], steps: [],
  rating: 0, timeMinutes: 10, servings: 1, notes: '', isFavorite: fav,
})

beforeEach(async () => { await db.recipes.clear() })

test('показывает рецепты и фильтрует по поиску', async () => {
  await addRecipe(mk('Борщ'))
  await addRecipe(mk('Окрошка'))
  render(<MemoryRouter><HomePage /></MemoryRouter>)
  await waitFor(() => expect(screen.getByText('Борщ')).toBeInTheDocument())
  await userEvent.type(screen.getByPlaceholderText('Поиск рецептов'), 'окро')
  await waitFor(() => expect(screen.queryByText('Борщ')).not.toBeInTheDocument())
  expect(screen.getByText('Окрошка')).toBeInTheDocument()
})
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `npm test src/pages/HomePage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Реализовать HomePage**

`src/pages/HomePage.tsx`:
```tsx
import { useEffect, useMemo, useState } from 'react'
import { getAllRecipes } from '../db/recipes'
import { getCategories } from '../db/categories'
import { Recipe, Category } from '../db/types'
import RecipeCard from '../components/RecipeCard'

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<string>('')
  const [favOnly, setFavOnly] = useState(false)

  useEffect(() => {
    getAllRecipes().then(setRecipes)
    getCategories().then(setCategories)
  }, [])

  const filtered = useMemo(() => recipes.filter((r) =>
    r.title.toLowerCase().includes(query.toLowerCase()) &&
    (cat ? r.category === cat : true) &&
    (favOnly ? r.isFavorite : true),
  ), [recipes, query, cat, favOnly])

  return (
    <div className="p-3 flex flex-col gap-3">
      <input
        className="w-full border rounded-lg px-3 py-2"
        placeholder="Поиск рецептов"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="flex gap-2 overflow-x-auto">
        <button onClick={() => setCat('')} className={`px-3 py-1 rounded-full border text-sm ${cat === '' ? 'bg-black text-white' : ''}`}>Все</button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setCat(c.name)} className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${cat === c.name ? 'bg-black text-white' : ''}`}>{c.name}</button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={favOnly} onChange={(e) => setFavOnly(e.target.checked)} />
        Только избранное
      </label>
      {filtered.length === 0
        ? <p className="text-center text-gray-400 mt-10">Пока нет рецептов. Добавь первый! 🍳</p>
        : <div className="grid grid-cols-2 gap-3">{filtered.map((r) => <RecipeCard key={r.id} recipe={r} />)}</div>}
    </div>
  )
}
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `npm test src/pages/HomePage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "feat: главная — список, поиск, фильтры, избранное"
```

---

## Task 10: Форма добавления/редактирования рецепта

**Files:**
- Modify: `src/pages/EditRecipePage.tsx`
- Test: `src/pages/EditRecipePage.test.tsx`

**Interfaces:**
- Consumes: `addRecipe`, `getRecipe`, `updateRecipe` (Task 3), `getCategories` (Task 4), `StarRating`, `PhotoPicker` (Task 8), `RecipeInput` (Task 3).
- Produces: форма создания (`/add`) и редактирования (`/edit/:id`). Поля: название, категория (select), теги (через запятую), ингредиенты (динамический список name/amount/unit), шаги (динамический список), фото, оценка, время, порции, заметки. По сохранению — переход на страницу рецепта.

- [ ] **Step 1: Написать тест (создание рецепта)**

`src/pages/EditRecipePage.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `npm test src/pages/EditRecipePage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Реализовать EditRecipePage**

`src/pages/EditRecipePage.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addRecipe, getRecipe, updateRecipe, RecipeInput } from '../db/recipes'
import { getCategories } from '../db/categories'
import { Category, Ingredient, Step } from '../db/types'
import StarRating from '../components/StarRating'
import PhotoPicker from '../components/PhotoPicker'

const empty: RecipeInput = {
  title: '', category: '', tags: [], ingredients: [{ name: '', amount: null, unit: '' }],
  steps: [{ text: '' }], rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false,
}

export default function EditRecipePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<RecipeInput>(empty)
  const [photo, setPhoto] = useState<Blob>()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => { getCategories().then(setCategories) }, [])
  useEffect(() => {
    if (!id) return
    getRecipe(id).then((r) => {
      if (r) {
        const { photo: p, id: _id, createdAt, updatedAt, ...rest } = r
        setForm(rest)
        setPhoto(p)
      }
    })
  }, [id])

  const set = (patch: Partial<RecipeInput>) => setForm((f) => ({ ...f, ...patch }))
  const setIngredient = (i: number, patch: Partial<Ingredient>) =>
    set({ ingredients: form.ingredients.map((ing, j) => j === i ? { ...ing, ...patch } : ing) })
  const setStep = (i: number, text: string) =>
    set({ steps: form.steps.map((s, j) => j === i ? { ...s, text } : s) })

  async function save() {
    const data: RecipeInput = { ...form, ingredients: form.ingredients.filter(i => i.name.trim()), steps: form.steps.filter(s => s.text.trim()) }
    const payload = { ...data, photo }
    if (id) { await updateRecipe(id, payload); navigate(`/recipe/${id}`) }
    else { const r = await addRecipe(payload); navigate(`/recipe/${r.id}`) }
  }

  return (
    <div className="p-3 flex flex-col gap-4">
      <label className="flex flex-col gap-1">Название
        <input aria-label="Название" className="border rounded px-3 py-2" value={form.title} onChange={(e) => set({ title: e.target.value })} />
      </label>

      <label className="flex flex-col gap-1">Категория
        <select className="border rounded px-3 py-2" value={form.category} onChange={(e) => set({ category: e.target.value })}>
          <option value="">— выбрать —</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1">Теги (через запятую)
        <input className="border rounded px-3 py-2" value={form.tags.join(', ')} onChange={(e) => set({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} />
      </label>

      <div className="flex gap-2">
        <label className="flex flex-col gap-1 flex-1">Время (мин)
          <input type="number" className="border rounded px-3 py-2" value={form.timeMinutes ?? ''} onChange={(e) => set({ timeMinutes: e.target.value ? Number(e.target.value) : null })} />
        </label>
        <label className="flex flex-col gap-1 flex-1">Порции
          <input type="number" className="border rounded px-3 py-2" value={form.servings ?? ''} onChange={(e) => set({ servings: e.target.value ? Number(e.target.value) : null })} />
        </label>
      </div>

      <div className="flex flex-col gap-1">Ингредиенты
        {form.ingredients.map((ing, i) => (
          <div key={i} className="flex gap-1">
            <input placeholder="Название" className="border rounded px-2 py-1 flex-1" value={ing.name} onChange={(e) => setIngredient(i, { name: e.target.value })} />
            <input placeholder="Кол-во" className="border rounded px-2 py-1 w-20" value={ing.amount ?? ''} onChange={(e) => setIngredient(i, { amount: e.target.value ? Number(e.target.value) : null })} />
            <input placeholder="Ед." className="border rounded px-2 py-1 w-16" value={ing.unit} onChange={(e) => setIngredient(i, { unit: e.target.value })} />
          </div>
        ))}
        <button type="button" className="text-sm text-blue-600 self-start" onClick={() => set({ ingredients: [...form.ingredients, { name: '', amount: null, unit: '' }] })}>+ ингредиент</button>
      </div>

      <div className="flex flex-col gap-1">Шаги
        {form.steps.map((s, i) => (
          <textarea key={i} placeholder={`Шаг ${i + 1}`} className="border rounded px-2 py-1" value={s.text} onChange={(e) => setStep(i, e.target.value)} />
        ))}
        <button type="button" className="text-sm text-blue-600 self-start" onClick={() => set({ steps: [...form.steps, { text: '' }] })}>+ шаг</button>
      </div>

      <div className="flex flex-col gap-1">Фото
        <PhotoPicker value={photo} onChange={setPhoto} />
      </div>

      <div className="flex flex-col gap-1">Оценка
        <StarRating value={form.rating} onChange={(rating) => set({ rating })} />
      </div>

      <label className="flex flex-col gap-1">Заметки / от кого
        <textarea className="border rounded px-3 py-2" value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
      </label>

      <button type="button" className="bg-black text-white rounded-lg py-3 font-semibold" onClick={save} disabled={!form.title.trim()}>Сохранить</button>
    </div>
  )
}
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `npm test src/pages/EditRecipePage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "feat: форма добавления/редактирования рецепта"
```

---

## Task 11: Страница рецепта (просмотр, избранное, удаление)

**Files:**
- Modify: `src/pages/RecipePage.tsx`
- Test: `src/pages/RecipePage.test.tsx`

**Interfaces:**
- Consumes: `getRecipe`, `deleteRecipe`, `toggleFavorite` (Task 3), `StarRating` (Task 8).
- Produces: просмотр рецепта (фото, мета, ингредиенты, шаги, заметки); кнопки «В избранное», «Редактировать» (→ `/edit/:id`), «Удалить» (→ `/`).

- [ ] **Step 1: Написать тест**

`src/pages/RecipePage.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `npm test src/pages/RecipePage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Реализовать RecipePage**

`src/pages/RecipePage.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getRecipe, deleteRecipe, toggleFavorite } from '../db/recipes'
import { Recipe } from '../db/types'
import StarRating from '../components/StarRating'

export default function RecipePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe>()
  const [photoUrl, setPhotoUrl] = useState<string>()

  useEffect(() => { if (id) getRecipe(id).then(setRecipe) }, [id])
  useEffect(() => {
    if (!recipe?.photo) { setPhotoUrl(undefined); return }
    const u = URL.createObjectURL(recipe.photo)
    setPhotoUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [recipe?.photo])

  if (!recipe) return <div className="p-4">Загрузка…</div>

  async function onDelete() {
    if (id && confirm('Удалить рецепт?')) { await deleteRecipe(id); navigate('/') }
  }
  async function onFav() {
    if (id) { await toggleFavorite(id); setRecipe(await getRecipe(id)) }
  }

  return (
    <div className="p-3 flex flex-col gap-4">
      {photoUrl && <img src={photoUrl} alt={recipe.title} className="w-full h-56 object-cover rounded-xl" />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{recipe.title}</h1>
        <button onClick={onFav} aria-label="В избранное" className="text-2xl">{recipe.isFavorite ? '❤️' : '🤍'}</button>
      </div>
      <div className="text-sm text-gray-600">{recipe.category} · {recipe.timeMinutes ?? '—'} мин · {recipe.servings ?? '—'} порц.</div>
      <StarRating value={recipe.rating} />
      {recipe.tags.length > 0 && <div className="flex gap-2 flex-wrap">{recipe.tags.map(t => <span key={t} className="text-xs bg-gray-100 rounded-full px-2 py-1">#{t}</span>)}</div>}

      <section>
        <h2 className="font-semibold mb-1">Ингредиенты</h2>
        <ul className="list-disc pl-5">
          {recipe.ingredients.map((i, idx) => <li key={idx}>{i.name}{i.amount != null ? ` — ${i.amount} ${i.unit}` : ''}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-1">Приготовление</h2>
        <ol className="list-decimal pl-5 flex flex-col gap-1">
          {recipe.steps.map((s, idx) => <li key={idx}>{s.text}</li>)}
        </ol>
      </section>

      {recipe.notes && <section><h2 className="font-semibold mb-1">Заметки</h2><p className="whitespace-pre-wrap">{recipe.notes}</p></section>}

      <div className="flex gap-2">
        <Link to={`/edit/${recipe.id}`} className="flex-1 text-center border rounded-lg py-2">Редактировать</Link>
        <button onClick={onDelete} className="flex-1 text-red-600 border border-red-200 rounded-lg py-2">Удалить</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `npm test src/pages/RecipePage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "feat: страница рецепта (просмотр, избранное, удаление)"
```

---

## Task 12: Настройки — бэкап и управление категориями

**Files:**
- Modify: `src/pages/SettingsPage.tsx`
- Test: `src/pages/SettingsPage.test.tsx`

**Interfaces:**
- Consumes: `downloadBackup`, `parseBackupFile`, `importBackup` (Task 6), `getCategories`, `addCategory`, `renameCategory`, `deleteCategory` (Task 4).
- Produces: экран настроек — кнопка «Сохранить копию (бэкап)», загрузка файла импорта (replace/merge), управление списком категорий.

- [ ] **Step 1: Написать тест (импорт из файла)**

`src/pages/SettingsPage.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `npm test src/pages/SettingsPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Реализовать SettingsPage**

`src/pages/SettingsPage.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { downloadBackup, parseBackupFile, importBackup } from '../db/backup'
import { getCategories, addCategory, renameCategory, deleteCategory } from '../db/categories'
import { Category } from '../db/types'

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCat, setNewCat] = useState('')
  const [msg, setMsg] = useState('')

  const reload = () => getCategories().then(setCategories)
  useEffect(() => { reload() }, [])

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const backup = parseBackupFile(text)
      await importBackup(backup, 'merge')
      await reload()
      setMsg(`Импортировано рецептов: ${backup.recipes.length}`)
    } catch (err) {
      setMsg('Ошибка: не удалось прочитать файл бэкапа')
    }
  }

  return (
    <div className="p-3 flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Резервная копия</h2>
        <button onClick={() => downloadBackup()} className="bg-black text-white rounded-lg py-2">Сохранить копию (бэкап)</button>
        <label className="flex flex-col gap-1 text-sm">Загрузить файл бэкапа
          <input type="file" accept="application/json,.json" aria-label="Загрузить файл бэкапа" onChange={onImport} />
        </label>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Категории</h2>
        {categories.map((c) => (
          <div key={c.id} className="flex gap-2 items-center">
            <input className="border rounded px-2 py-1 flex-1" value={c.name} onChange={(e) => { renameCategory(c.id, e.target.value); setCategories(cs => cs.map(x => x.id === c.id ? { ...x, name: e.target.value } : x)) }} />
            <button onClick={async () => { await deleteCategory(c.id); reload() }} className="text-red-500 text-sm">Удалить</button>
          </div>
        ))}
        <div className="flex gap-2">
          <input className="border rounded px-2 py-1 flex-1" placeholder="Новая категория" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <button onClick={async () => { if (newCat.trim()) { await addCategory(newCat.trim()); setNewCat(''); reload() } }} className="border rounded px-3">+</button>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `npm test src/pages/SettingsPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Прогнать все тесты**

Run: `npm test`
Expected: PASS (все тесты).

- [ ] **Step 6: Коммит**

```bash
git add -A
git commit -m "feat: настройки — бэкап и управление категориями"
```

---

## Task 13: PWA-упаковка (манифест, оффлайн, иконки)

**Files:**
- Modify: `vite.config.ts`, `index.html`
- Create: `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`

**Interfaces:**
- Consumes: всё приложение.
- Produces: устанавливаемое PWA с оффлайн-кэшем оболочки и иконкой на домашнем экране.

- [ ] **Step 1: Подготовить иконки**

Положить в `public/` три PNG: `icon-192.png` (192×192), `icon-512.png` (512×512), `icon-maskable-512.png` (512×512, с отступами для maskable). Временно можно простую иконку 🍳 на однотонном фоне (финальную сделаем на этапе дизайна).

- [ ] **Step 2: Настроить vite-plugin-pwa**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Кулинарная книга',
        short_name: 'Рецепты',
        description: 'Личная кулинарная книга',
        lang: 'ru',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,woff2}'] },
    }),
  ],
})
```

- [ ] **Step 3: Добавить мета-теги в index.html**

В `<head>` файла `index.html` добавить:
```html
<meta name="theme-color" content="#ffffff" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Рецепты" />
<link rel="apple-touch-icon" href="/icon-192.png" />
```
И заменить `<title>` на `Кулинарная книга`.

- [ ] **Step 4: Проверить production-сборку**

Run: `npm run build && npm run preview`
Expected: сборка успешна; в `dist/` присутствуют `manifest.webmanifest` и service worker (`sw.js`). Открыть превью в браузере — приложение работает.

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "feat: PWA-упаковка (манифест, оффлайн, иконки)"
```

---

## Task 14: Деплой на GitHub Pages

**Files:**
- Modify: `vite.config.ts` (base path)
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: production-сборка (Task 13).
- Produces: публично доступный URL вида `https://<user>.github.io/<repo>/`, устанавливаемый на айфон.

- [ ] **Step 1: Задать base path**

В `vite.config.ts` добавить в `defineConfig({...})` поле `base: '/<repo>/',` где `<repo>` — имя GitHub-репозитория (например `/recipe-book/`). Для проверки локально `base` можно временно оставить `'/'`.

- [ ] **Step 2: Создать GitHub Actions workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: recipe-book
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: recipe-book/dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Создать репозиторий на GitHub и запушить**

```bash
gh repo create recipe-book --private --source=. --remote=origin --push
```
(или вручную: создать репозиторий на github.com, затем `git remote add origin <url>` и `git push -u origin main`).

- [ ] **Step 4: Включить Pages**

В настройках репозитория на GitHub: Settings → Pages → Source = «GitHub Actions». Дождаться завершения workflow во вкладке Actions.

- [ ] **Step 5: Проверить установку на айфоне**

Открыть URL в Safari на айфоне → «Поделиться» → «На экран Домой». Запустить с домашнего экрана — приложение открывается на весь экран, работает оффлайн.

- [ ] **Step 6: Финальный коммит**

```bash
git add -A
git commit -m "feat: деплой на GitHub Pages"
git push
```

---

## Проверка соответствия спеке (self-review)

- §3 PWA / локальные данные / GitHub Pages → Tasks 2, 13, 14. ✓
- §3 Бэкап + первичное наполнение через импорт → Task 6 (логика), Task 12 (UI импорт). ✓
- §5 Модель данных (Recipe/Category/ShoppingItem/Settings) → Task 2. ✓
- §6 Экраны: Главная (Task 9), Рецепт (Task 11), Добавить/Редактировать (Task 10), Настройки (Task 12). Режим готовки и Список покупок → **Фаза 2**.
- §7 Фишки: избранное/поиск/фильтры (Task 9), бэкап (Tasks 6, 12). Масштабирование порций, режим готовки, таймеры, список покупок, конвертер единиц → **Фаза 2**.
- §10 Доставка PWA → Tasks 13, 14. ✓
- §11 Non-goals не реализуются. ✓

**Отложено в Фазу 2 (отдельный план):** масштабирование порций, режим готовки + Wake Lock, таймеры в шагах, список покупок (экран + агрегация), конвертер единиц. Перенос осознанный — Фаза 1 даёт самостоятельно полезное приложение (наполнение из тетрадки + просмотр/поиск/правка/бэкап).
```
