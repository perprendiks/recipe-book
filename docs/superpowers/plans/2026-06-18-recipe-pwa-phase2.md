# Кулинарная книга — План реализации (Фаза 2: кухонные фишки)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Добавить кухонные фишки поверх готовой Фазы 1: масштабирование порций, конвертер единиц, список покупок, режим готовки с таймерами.

**Architecture:** Чистая логика в `src/lib/*` и `src/db/shopping.ts` (TDD). UI поверх существующей дизайн-системы (токены `--accent` и т.п., классы `.field`/`.btn-primary`/`.section-title`, шрифты Lora/Nunito). Маршруты через HashRouter.

**Tech Stack:** React + TS + Vite + Tailwind + Dexie. Тесты Vitest + RTL + fake-indexeddb.

## Global Constraints

- Язык интерфейса: русский. Только клиент. `verbatimModuleSyntax` → типы через `import type`.
- `npm run build` ДОЛЖЕН оставаться зелёным (не только тесты). Запускать build перед коммитом.
- Использовать существующую дизайн-систему (тёплые токены, `.field`, `.btn-primary`, `.btn-secondary`, `.section-title`, `rounded-card/chip/photo`, `font-display`).
- IDs `crypto.randomUUID()`, время `Date.now()`. Частые коммиты.

---

## Task 1: Масштабирование порций

**Files:** Create `src/lib/scale.ts`, `src/lib/scale.test.ts`. Modify `src/pages/RecipePage.tsx`.

**Interfaces produced:**
- `scaleIngredients(ingredients: Ingredient[], factor: number): Ingredient[]` — умножает числовой `amount` на `factor`, округляет до 2 знаков (убирая хвостовые нули); `amount === null` не трогает.
- `formatAmount(n: number): string` — аккуратное число (целое без `.0`, дробное до 2 знаков).

- [ ] **Step 1: Тест scale.ts**

```ts
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
```

- [ ] **Step 2: Запустить — FAIL.** `npm test src/lib/scale.test.ts`

- [ ] **Step 3: Реализовать src/lib/scale.ts**

```ts
import type { Ingredient } from '../db/types'

export function formatAmount(n: number): string {
  return Number(n.toFixed(2)).toString()
}

export function scaleIngredients(ingredients: Ingredient[], factor: number): Ingredient[] {
  return ingredients.map((i) =>
    i.amount == null ? i : { ...i, amount: Number((i.amount * factor).toFixed(2)) },
  )
}
```

- [ ] **Step 4: Запустить — PASS.** Затем `npm test` и `npm run build`.

- [ ] **Step 5: UI в RecipePage.tsx**

Добавить состояние `const [servings, setServings] = useState(recipe.servings)`. Перед списком ингредиентов (если `recipe.servings` задан и > 0) — компактный степпер порций: кнопки `−` / `+` и текущее число порций (тёплый стиль: круглые кнопки `w-9 h-9 rounded-chip border border-border`, число `font-display`). `factor = servings / recipe.servings`. Ингредиенты выводить через `scaleIngredients(recipe.ingredients, factor)`, числа — через `formatAmount`. Минимум порций 1. Если `recipe.servings` пуст — степпер не показывать, ингредиенты как есть.

- [ ] **Step 6: Коммит.** `feat: масштабирование порций на странице рецепта`

---

## Task 2: Конвертер единиц измерения

**Files:** Create `src/lib/convert.ts`, `src/lib/convert.test.ts`, `src/components/UnitConverter.tsx`. Modify `src/pages/SettingsPage.tsx`.

**Interfaces produced:**
- `CONVERTERS: { id: string; label: string; from: string; to: string; factor: number }[]` — наборы: г↔кг, мл↔л, ст.л→мл (15), ч.л→мл (5), стакан→мл (250).
- `convert(value: number, factor: number): number` — `value * factor`, округление до 2 знаков.

- [ ] **Step 1: Тест convert.ts**

```ts
import { expect, test } from 'vitest'
import { convert } from './convert'
test('convert умножает и округляет', () => {
  expect(convert(2, 1000)).toBe(2000)
  expect(convert(3, 15)).toBe(45)
  expect(convert(1.5, 250)).toBe(375)
})
```

- [ ] **Step 2: FAIL → реализовать convert.ts**

```ts
export interface Converter { id: string; label: string; from: string; to: string; factor: number }

export const CONVERTERS: Converter[] = [
  { id: 'kg', label: 'Килограммы → граммы', from: 'кг', to: 'г', factor: 1000 },
  { id: 'l', label: 'Литры → миллилитры', from: 'л', to: 'мл', factor: 1000 },
  { id: 'tbsp', label: 'Столовые ложки → мл', from: 'ст.л', to: 'мл', factor: 15 },
  { id: 'tsp', label: 'Чайные ложки → мл', from: 'ч.л', to: 'мл', factor: 5 },
  { id: 'cup', label: 'Стаканы → мл', from: 'стакан', to: 'мл', factor: 250 },
]

export function convert(value: number, factor: number): number {
  return Number((value * factor).toFixed(2))
}
```

- [ ] **Step 3: PASS, build.**

- [ ] **Step 4: UnitConverter.tsx**

Компонент: `<select>` из `CONVERTERS` (по `label`), числовое поле ввода (класс `field`), вывод результата `convert(value, selected.factor)` с подписью единиц (`X ст.л = Y мл`). Стиль тёплый, без лишних контейнеров.

- [ ] **Step 5: Встроить в SettingsPage.tsx**

Добавить секцию `<h2 className="section-title">Конвертер единиц</h2>` + `<UnitConverter />` после секции категорий.

- [ ] **Step 6: Коммит.** `feat: конвертер единиц в настройках`

---

## Task 3: Список покупок

**Files:** Create `src/db/shopping.ts`, `src/db/shopping.test.ts`, `src/pages/ShoppingPage.tsx`. Modify `src/components/Layout.tsx`, `src/App.tsx`, `src/pages/RecipePage.tsx`.

**Interfaces produced (src/db/shopping.ts), используют таблицу `db.shopping` (ShoppingItem уже в типах):**
- `addItemsFromRecipe(recipe: Recipe): Promise<number>` — добавляет все ингредиенты рецепта в список (name/amount/unit, checked:false, fromRecipeId), возвращает число добавленных.
- `getShoppingList(): Promise<ShoppingItem[]>` — все позиции, не-вычеркнутые сверху.
- `addManualItem(name: string): Promise<void>` — позиция вручную (amount:null, unit:'').
- `toggleItem(id: string): Promise<void>` — переключить checked.
- `removeItem(id: string): Promise<void>`.
- `clearChecked(): Promise<void>` — удалить все вычеркнутые.

- [ ] **Step 1: Тесты shopping.test.ts** (fake-indexeddb): addItemsFromRecipe добавляет N позиций; toggleItem переключает checked; addManualItem добавляет; clearChecked удаляет только checked; removeItem удаляет. Использовать `beforeEach(() => db.shopping.clear())`.

```ts
import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { db } from './db'
import { addItemsFromRecipe, getShoppingList, addManualItem, toggleItem, removeItem, clearChecked } from './shopping'
import type { Recipe } from './types'

const recipe = { id: 'r1', title: 'Тест', category: '', tags: [], ingredients: [{ name: 'Мука', amount: 200, unit: 'г' }, { name: 'Соль', amount: null, unit: '' }], steps: [], rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false, createdAt: 1, updatedAt: 1 } as Recipe

beforeEach(async () => { await db.shopping.clear() })

test('addItemsFromRecipe добавляет ингредиенты', async () => {
  const n = await addItemsFromRecipe(recipe)
  expect(n).toBe(2)
  expect((await getShoppingList()).length).toBe(2)
})
test('toggleItem переключает, clearChecked удаляет вычеркнутые', async () => {
  await addItemsFromRecipe(recipe)
  const list = await getShoppingList()
  await toggleItem(list[0].id)
  await clearChecked()
  expect((await getShoppingList()).length).toBe(1)
})
test('addManualItem и removeItem', async () => {
  await addManualItem('Хлеб')
  const list = await getShoppingList()
  expect(list[0].name).toBe('Хлеб')
  await removeItem(list[0].id)
  expect((await getShoppingList()).length).toBe(0)
})
```

- [ ] **Step 2: FAIL → реализовать shopping.ts** (импорты `import type { Recipe, ShoppingItem } from './types'`; `crypto.randomUUID()`; getShoppingList сортирует: не-checked сверху).

- [ ] **Step 3: PASS, build.**

- [ ] **Step 4: ShoppingPage.tsx** — заголовок «Список покупок» (font-display), поле + кнопка для добавления вручную, список позиций с чекбоксами (вычеркнутые — `line-through text-ink-faint`), кнопка удаления позиции, внизу «Очистить купленное» (`btn-secondary`). Пустое состояние дружелюбное. Загрузка через `getShoppingList`, обновление после действий.

- [ ] **Step 5: Кнопка в RecipePage** — рядом с «Готовить»/действиями добавить кнопку «В список покупок» (btn-secondary), вызывает `addItemsFromRecipe(recipe)`, показывает короткое подтверждение (`Добавлено в список`).

- [ ] **Step 6: Навигация и маршрут** — в `Layout.tsx` добавить 4-й таб «Покупки» (icon: корзина, route `/shopping`); в `App.tsx` маршрут `/shopping` → `ShoppingPage`. Обновить smoke-тест App при необходимости (проверка 4 табов).

- [ ] **Step 7: Коммит.** `feat: список покупок (агрегация из рецептов, ручное добавление)`

---

## Task 4: Режим готовки с таймерами

**Files:** Create `src/lib/parseTime.ts`, `src/lib/parseTime.test.ts`, `src/components/StepTimer.tsx`, `src/pages/CookPage.tsx`. Modify `src/App.tsx`, `src/pages/RecipePage.tsx`.

**Interfaces produced:**
- `parseMinutes(text: string): number | null` — извлекает первое число минут из текста шага (например «варить 10 минут» → 10; «20-25 мин» → 20; нет времени → null). Регэксп на «N мин/минут/минуты».
- `StepTimer({ minutes }: { minutes: number })` — кнопка запуска, обратный отсчёт mm:ss, по окончании вибрация (`navigator.vibrate`) + звуковой сигнал (Web Audio короткий beep, без внешних файлов), кнопки пауза/сброс.
- `CookPage` — маршрут `/cook/:id`.

- [ ] **Step 1: Тест parseTime.ts**

```ts
import { expect, test } from 'vitest'
import { parseMinutes } from './parseTime'
test('parseMinutes извлекает минуты', () => {
  expect(parseMinutes('варить 10 минут')).toBe(10)
  expect(parseMinutes('запекать 20-25 мин')).toBe(20)
  expect(parseMinutes('перемешать')).toBeNull()
})
```

- [ ] **Step 2: FAIL → реализовать parseTime.ts**

```ts
export function parseMinutes(text: string): number | null {
  const m = text.match(/(\d+)\s*(?:-\s*\d+\s*)?мин/i)
  return m ? Number(m[1]) : null
}
```

- [ ] **Step 3: PASS, build.**

- [ ] **Step 4: StepTimer.tsx** — состояние оставшихся секунд, `setInterval`, формат mm:ss крупно (font-display), кнопки старт/пауза/сброс (тёплый стиль). По достижении 0: `navigator.vibrate?.([200,100,200])` и короткий beep через `new AudioContext()` (oscillator 0.2s). Чистить интервал в cleanup. Уважать reduced-motion не требуется (это таймер).

- [ ] **Step 5: CookPage.tsx** (`/cook/:id`) — загрузить рецепт через `getRecipe`. Wake Lock: в `useEffect` запросить `navigator.wakeLock?.request('screen')`, освободить в cleanup (обернуть в try/catch — API может отсутствовать). Показывать ОДИН шаг за раз КРУПНО (`text-2xl leading-relaxed`, font свободный, max-w-[65ch]), номер шага «Шаг N из M». Кнопки «Назад»/«Далее» (большие, тёплые), свайп опционально. Если у текущего шага `parseMinutes(step.text)` не null — показать `<StepTimer minutes={...} />`. На последнем шаге кнопка «Готово» → назад к рецепту. Кнопка выхода (×) сверху → `/recipe/:id`. Экран на всю высоту, фон `bg-bg`.

- [ ] **Step 6: Маршрут и кнопка** — `App.tsx`: маршрут `/cook/:id` → `CookPage` (ВНЕ Layout, чтобы не было нижней навигации в режиме готовки — отдельный полноэкранный маршрут). `RecipePage.tsx`: добавить главную кнопку «Готовить» (btn-primary, на всю ширину, над/рядом с «Редактировать») → `navigate('/cook/' + recipe.id)`.

- [ ] **Step 7: build + полный npm test зелёные. Коммит.** `feat: режим готовки (Wake Lock, шаги, таймеры)`

---

## Проверка соответствия спеке (§7 Фаза 2)

- Масштабирование порций → Task 1 ✓
- Конвертер единиц → Task 2 ✓
- Список покупок (агрегация) → Task 3 ✓
- Режим готовки (Wake Lock + шаги) → Task 4 ✓
- Таймеры в шагах → Task 4 (StepTimer + parseMinutes) ✓
