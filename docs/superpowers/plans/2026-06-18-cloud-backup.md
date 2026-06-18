# Облачный автобэкап — План реализации

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Автоматическая синхронизация всей коллекции рецептов в облако (Supabase) при каждом изменении, с входом по email/паролю и восстановлением на новом устройстве. Облако опционально — без входа приложение работает локально.

**Architecture:** Тонкие изолированные модули поверх готового приложения: Supabase-клиент, обёртка Auth, модуль синхронизации (push/pull, last-write-wins, debounced auto-push через Dexie-хуки), UI входа и индикатор статуса в Настройках. Переиспользуем существующие `exportBackup`/`importBackup` из `src/db/backup.ts`.

**Tech Stack:** React + TS + Vite + Dexie (есть), `@supabase/supabase-js` v2 (новое). Тесты Vitest + RTL + мок Supabase-клиента.

## Global Constraints

- Язык интерфейса: русский. `verbatimModuleSyntax` → типы через `import type`.
- `npm run build` ДОЛЖЕН оставаться зелёным; запускать перед коммитом.
- Дизайн-система: `.field`, `.btn-primary`, `.btn-secondary`, `.section-title`, токены `--accent`/`--ink`/`--border`/`--danger`/`--success`, `font-display`.
- Облако ОПЦИОНАЛЬНО: при пустом конфиге (`SUPABASE_URL === ''`) приложение работает локально, раздел облака показывает «не настроено» и не падает.
- Конфиг Supabase в `src/config.ts` (anon-ключ публичный по дизайну Supabase — безопасно).
- Стратегия синхронизации: last-write-wins по времени (`updated_at` облака vs `max(updatedAt)` локальных рецептов).
- IDs `crypto.randomUUID()`, время `Date.now()`. Частые коммиты.

---

## Task 1: Зависимость, конфиг и клиент Supabase

**Files:** Create `src/config.ts`, `src/db/supabase.ts`, `src/db/supabase.test.ts`.

**Interfaces produced:**
- `SUPABASE_URL: string`, `SUPABASE_ANON_KEY: string` (из `src/config.ts`).
- `supabase: SupabaseClient | null` — клиент, либо `null` если конфиг пуст.
- `isCloudConfigured(): boolean`.

- [ ] **Step 1: Установить зависимость**

Run (из `recipe-book/`): `npm install @supabase/supabase-js`

- [ ] **Step 2: Создать config.ts**

`src/config.ts`:
```ts
// Значения из проекта Supabase (Dashboard → Project Settings → API).
// Публичные: anon-ключ предназначен для клиента, данные защищены входом и RLS.
// Пока пусто — облако отключено, приложение работает локально.
export const SUPABASE_URL = ''
export const SUPABASE_ANON_KEY = ''
```

- [ ] **Step 3: Создать клиент**

`src/db/supabase.ts`:
```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config'

export function isCloudConfigured(): boolean {
  return SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== ''
}

export const supabase: SupabaseClient | null = isCloudConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null
```

- [ ] **Step 4: Тест**

`src/db/supabase.test.ts`:
```ts
import { expect, test } from 'vitest'
import { isCloudConfigured } from './supabase'

test('isCloudConfigured false при пустом конфиге', () => {
  expect(isCloudConfigured()).toBe(false)
})
```

- [ ] **Step 5: Запустить тест (PASS), `npm test`, `npm run build`.**

- [ ] **Step 6: Коммит.** `feat: клиент Supabase и конфиг облака`

---

## Task 2: Обёртка аутентификации

**Files:** Create `src/auth/auth.ts`, `src/auth/auth.test.ts`.

**Interfaces produced:**
- `interface AuthUser { id: string; email: string }`
- `signUp(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }>`
- `signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }>`
- `signOut(): Promise<void>`
- `getCurrentUser(): Promise<AuthUser | null>`
- `onAuthChange(cb: (user: AuthUser | null) => void): () => void` (возвращает отписку)

**Consumes:** `supabase` (Task 1).

- [ ] **Step 1: Тест с моканым supabase**

`src/auth/auth.test.ts`:
```ts
import { describe, expect, test, vi, beforeEach } from 'vitest'

const mockAuth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
}
vi.mock('../db/supabase', () => ({ supabase: { auth: mockAuth }, isCloudConfigured: () => true }))

import { signIn, getCurrentUser } from './auth'

beforeEach(() => vi.clearAllMocks())

test('signIn возвращает пользователя при успехе', async () => {
  mockAuth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.c' } }, error: null })
  const r = await signIn('a@b.c', 'pw')
  expect(r.user).toEqual({ id: 'u1', email: 'a@b.c' })
  expect(r.error).toBeNull()
})

test('signIn возвращает текст ошибки при неудаче', async () => {
  mockAuth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid login' } })
  const r = await signIn('a@b.c', 'bad')
  expect(r.user).toBeNull()
  expect(r.error).toBe('Invalid login')
})

test('getCurrentUser возвращает null без сессии', async () => {
  mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
  expect(await getCurrentUser()).toBeNull()
})
```

- [ ] **Step 2: Запустить — FAIL.**

- [ ] **Step 3: Реализовать auth.ts**

`src/auth/auth.ts`:
```ts
import { supabase } from '../db/supabase'

export interface AuthUser { id: string; email: string }

function toUser(u: { id: string; email?: string } | null | undefined): AuthUser | null {
  return u ? { id: u.id, email: u.email ?? '' } : null
}

export async function signUp(email: string, password: string) {
  if (!supabase) return { user: null, error: 'Облако не настроено' }
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { user: toUser(data?.user), error: error?.message ?? null }
}

export async function signIn(email: string, password: string) {
  if (!supabase) return { user: null, error: 'Облако не настроено' }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { user: toUser(data?.user), error: error?.message ?? null }
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return toUser(data?.user)
}

export function onAuthChange(cb: (user: AuthUser | null) => void): () => void {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(toUser(session?.user)))
  return () => data.subscription.unsubscribe()
}
```

- [ ] **Step 4: PASS, `npm test`, `npm run build`.**

- [ ] **Step 5: Коммит.** `feat: обёртка аутентификации Supabase`

---

## Task 3: Модуль синхронизации

**Files:** Create `src/db/sync.ts`, `src/db/sync.test.ts`.

**Interfaces produced:**
- `type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'`
- `pushBackup(): Promise<void>` — `exportBackup()` → upsert в таблицу `backups` (user_id, data, updated_at).
- `pullBackup(): Promise<boolean>` — прочитать ряд пользователя; если есть → `importBackup(data, 'replace')`, вернуть `true`; иначе `false`.
- `syncOnLogin(): Promise<void>` — если облако новее/локально пусто → pull, иначе push.
- `scheduleSync(): void` — debounced (3000 мс) push; пропускает, если не вошёл или офлайн.
- `getSyncStatus(): SyncStatus`, `onSyncStatus(cb: (s: SyncStatus) => void): () => void`.
- `localMaxUpdatedAt(): Promise<number>` — макс. `updatedAt` среди рецептов (0 если пусто).

**Consumes:** `supabase` (Task 1), `getCurrentUser` (Task 2), `exportBackup`/`importBackup` (`src/db/backup.ts`), `db` (`src/db/db.ts`).

- [ ] **Step 1: Тесты с моками**

`src/db/sync.test.ts`:
```ts
import 'fake-indexeddb/auto'
import { describe, expect, test, vi, beforeEach } from 'vitest'

const upsert = vi.fn().mockResolvedValue({ error: null })
const maybeSingle = vi.fn()
const mockFrom = vi.fn(() => ({
  upsert,
  select: () => ({ eq: () => ({ maybeSingle }) }),
}))
vi.mock('./supabase', () => ({ supabase: { from: mockFrom }, isCloudConfigured: () => true }))
vi.mock('../auth/auth', () => ({ getCurrentUser: vi.fn().mockResolvedValue({ id: 'u1', email: 'a@b.c' }) }))

import { pushBackup, pullBackup } from './sync'
import { db } from './db'
import { addRecipe } from './recipes'

beforeEach(async () => { await db.recipes.clear(); vi.clearAllMocks(); upsert.mockResolvedValue({ error: null }) })

test('pushBackup отправляет upsert с данными пользователя', async () => {
  await addRecipe({ title: 'Борщ', category: 'Супы', tags: [], ingredients: [], steps: [], rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false })
  await pushBackup()
  expect(upsert).toHaveBeenCalledTimes(1)
  const arg = upsert.mock.calls[0][0]
  expect(arg.user_id).toBe('u1')
  expect(arg.data.recipes.length).toBe(1)
})

test('pullBackup восстанавливает рецепты из облака', async () => {
  maybeSingle.mockResolvedValue({ data: { data: { version: 1, exportedAt: 1, recipes: [{ id: 'r1', title: 'Импорт', category: '', tags: [], ingredients: [], steps: [], rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false, createdAt: 1, updatedAt: 1 }], categories: [] } }, error: null })
  const ok = await pullBackup()
  expect(ok).toBe(true)
  expect((await db.recipes.toArray()).length).toBe(1)
})

test('pullBackup возвращает false если в облаке пусто', async () => {
  maybeSingle.mockResolvedValue({ data: null, error: null })
  expect(await pullBackup()).toBe(false)
})
```

- [ ] **Step 2: Запустить — FAIL.**

- [ ] **Step 3: Реализовать sync.ts**

`src/db/sync.ts`:
```ts
import { supabase } from './supabase'
import { getCurrentUser } from '../auth/auth'
import { exportBackup, importBackup, type BackupFile } from './backup'
import { db } from './db'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

let status: SyncStatus = 'idle'
const listeners = new Set<(s: SyncStatus) => void>()
function setStatus(s: SyncStatus) { status = s; listeners.forEach((l) => l(s)) }
export function getSyncStatus(): SyncStatus { return status }
export function onSyncStatus(cb: (s: SyncStatus) => void): () => void {
  listeners.add(cb); cb(status); return () => listeners.delete(cb)
}

export async function localMaxUpdatedAt(): Promise<number> {
  const all = await db.recipes.toArray()
  return all.reduce((m, r) => Math.max(m, r.updatedAt), 0)
}

export async function pushBackup(): Promise<void> {
  const user = await getCurrentUser()
  if (!supabase || !user) return
  if (typeof navigator !== 'undefined' && !navigator.onLine) { setStatus('offline'); return }
  setStatus('syncing')
  try {
    const data = await exportBackup()
    const { error } = await supabase.from('backups').upsert({ user_id: user.id, data, updated_at: new Date().toISOString() })
    setStatus(error ? 'error' : 'synced')
  } catch { setStatus('error') }
}

export async function pullBackup(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!supabase || !user) return false
  setStatus('syncing')
  try {
    const { data, error } = await supabase.from('backups').select('data').eq('user_id', user.id).maybeSingle()
    if (error) { setStatus('error'); return false }
    if (!data) { setStatus('synced'); return false }
    await importBackup(data.data as BackupFile, 'replace')
    setStatus('synced')
    return true
  } catch { setStatus('error'); return false }
}

export async function syncOnLogin(): Promise<void> {
  const user = await getCurrentUser()
  if (!supabase || !user) return
  try {
    const { data } = await supabase.from('backups').select('updated_at').eq('user_id', user.id).maybeSingle()
    const cloudTime = data?.updated_at ? new Date(data.updated_at).getTime() : 0
    const localTime = await localMaxUpdatedAt()
    if (cloudTime > localTime || localTime === 0) await pullBackup()
    else await pushBackup()
  } catch { setStatus('error') }
}

let timer: ReturnType<typeof setTimeout> | undefined
export function scheduleSync(): void {
  clearTimeout(timer)
  timer = setTimeout(() => { void pushBackup() }, 3000)
}
```

- [ ] **Step 4: PASS, `npm test`, `npm run build`.**

- [ ] **Step 5: Коммит.** `feat: модуль синхронизации (push/pull/last-write-wins)`

---

## Task 4: Авто-триггер синхронизации через Dexie-хуки

**Files:** Create `src/db/syncHooks.ts`, `src/db/syncHooks.test.ts`. Modify `src/main.tsx`.

**Interfaces produced:**
- `installSyncHooks(): void` — вешает хуки на `db.recipes` и `db.categories` (creating/updating/deleting) → `scheduleSync()`. Идемпотентна (повторный вызов не дублирует).

**Consumes:** `db` (Task 2 проекта), `scheduleSync` (Task 3).

- [ ] **Step 1: Тест**

`src/db/syncHooks.test.ts`:
```ts
import 'fake-indexeddb/auto'
import { expect, test, vi, beforeEach } from 'vitest'
const scheduleSync = vi.fn()
vi.mock('./sync', () => ({ scheduleSync }))
import { installSyncHooks } from './syncHooks'
import { db } from './db'
import { addRecipe } from './recipes'

beforeEach(async () => { await db.recipes.clear(); vi.clearAllMocks() })

test('изменение рецепта вызывает scheduleSync', async () => {
  installSyncHooks()
  await addRecipe({ title: 'X', category: '', tags: [], ingredients: [], steps: [], rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false })
  expect(scheduleSync).toHaveBeenCalled()
})
```

- [ ] **Step 2: FAIL → реализовать syncHooks.ts**

```ts
import { db } from './db'
import { scheduleSync } from './sync'

let installed = false
export function installSyncHooks(): void {
  if (installed) return
  installed = true
  for (const table of [db.recipes, db.categories]) {
    table.hook('creating', () => { scheduleSync() })
    table.hook('updating', () => { scheduleSync() })
    table.hook('deleting', () => { scheduleSync() })
  }
}
```

- [ ] **Step 3: PASS. Подключить в main.tsx**

В `src/main.tsx` до рендера добавить вызов `installSyncHooks()` (импорт из `./db/syncHooks`) — рядом с `seedCategories()`. Хуки безвредны без облака (scheduleSync сам пропускает push, если не вошёл).

- [ ] **Step 4: `npm test`, `npm run build`.**

- [ ] **Step 5: Коммит.** `feat: авто-триггер синхронизации через Dexie-хуки`

---

## Task 5: Индикатор статуса синхронизации

**Files:** Create `src/components/SyncStatus.tsx`.

**Interfaces produced:** `SyncStatus` компонент (без пропсов) — подписывается на `onSyncStatus`, показывает русский текст/иконку статуса.

**Consumes:** `onSyncStatus`, `getSyncStatus`, `type SyncStatus` (Task 3).

- [ ] **Step 1: Реализовать SyncStatus.tsx**

```tsx
import { useEffect, useState } from 'react'
import { onSyncStatus, type SyncStatus as Status } from '../db/sync'

const LABEL: Record<Status, string> = {
  idle: '', syncing: 'Сохраняю…', synced: '✓ Сохранено в облаке', offline: 'Нет сети', error: 'Ошибка синхронизации',
}
const COLOR: Record<Status, string> = {
  idle: 'text-ink-faint', syncing: 'text-ink-soft', synced: 'text-success', offline: 'text-ink-faint', error: 'text-danger',
}

export default function SyncStatus() {
  const [s, setS] = useState<Status>('idle')
  useEffect(() => onSyncStatus(setS), [])
  if (!LABEL[s]) return null
  return <span className={`text-sm ${COLOR[s]}`}>{LABEL[s]}</span>
}
```

- [ ] **Step 2: `npm run build` (зелёный).**

- [ ] **Step 3: Коммит.** `feat: индикатор статуса синхронизации`

---

## Task 6: Раздел входа в Настройках (AuthSection)

**Files:** Create `src/components/AuthSection.tsx`. Modify `src/pages/SettingsPage.tsx`.

**Interfaces produced:** `AuthSection` компонент (без пропсов).

**Consumes:** `signIn`/`signUp`/`signOut`/`getCurrentUser`/`onAuthChange`/`AuthUser` (Task 2), `isCloudConfigured` (Task 1), `syncOnLogin` (Task 3), `SyncStatus` (Task 5).

- [ ] **Step 1: Реализовать AuthSection.tsx**

Поведение:
- Если `!isCloudConfigured()` → показать заметку «Облако не настроено» (серым) и ничего больше.
- Иначе: состояние `user` (через `getCurrentUser` на mount + `onAuthChange`).
  - Не вошёл: поля email (`type=email`, class `field`) и пароль (`type=password`, class `field`), кнопки «Войти» (btn-primary) и «Зарегистрироваться» (btn-secondary). При успехе входа/регистрации вызвать `syncOnLogin()`. Ошибку показать красным (`text-danger`).
  - Вошёл: текст «Вход выполнен: {email}», `<SyncStatus />`, кнопка «Выйти» (btn-secondary) → `signOut()`.
- Тёплый стиль (`.field`, `.btn-primary`, `.btn-secondary`, `text-ink`/`text-ink-soft`/`text-danger`).

```tsx
import { useEffect, useState } from 'react'
import { signIn, signUp, signOut, getCurrentUser, onAuthChange, type AuthUser } from '../auth/auth'
import { isCloudConfigured } from '../db/supabase'
import { syncOnLogin } from '../db/sync'
import SyncStatus from './SyncStatus'

export default function AuthSection() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isCloudConfigured()) return
    getCurrentUser().then(setUser)
    return onAuthChange(setUser)
  }, [])

  if (!isCloudConfigured()) {
    return <p className="text-sm text-ink-faint">Облако пока не настроено.</p>
  }

  async function run(fn: typeof signIn) {
    setBusy(true); setError('')
    const { user: u, error: e } = await fn(email, password)
    setBusy(false)
    if (e) { setError(e); return }
    setUser(u)
    setPassword('')
    await syncOnLogin()
  }

  if (user) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-ink-soft">Вход выполнен: <span className="text-ink font-semibold">{user.email}</span></p>
        <SyncStatus />
        <button className="btn-secondary" onClick={() => signOut().then(() => setUser(null))}>Выйти</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-soft">Войди, чтобы рецепты сохранялись в облако автоматически.</p>
      <input className="field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="field" type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary flex-1" disabled={busy || !email || !password} onClick={() => run(signIn)}>Войти</button>
        <button className="btn-secondary flex-1" disabled={busy || !email || !password} onClick={() => run(signUp)}>Регистрация</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Встроить в SettingsPage.tsx**

Добавить новую секцию ПЕРВОЙ (над «Резервная копия»):
```tsx
<section className="flex flex-col gap-3">
  <h2 className="section-title">Облако</h2>
  <AuthSection />
</section>
```
Импорт: `import AuthSection from '../components/AuthSection'`.

- [ ] **Step 3: `npm test` (существующий SettingsPage-тест проходит), `npm run build`.**

- [ ] **Step 4: Коммит.** `feat: раздел облака (вход/регистрация) в Настройках`

---

## Task 7: Инициализация синхронизации при старте

**Files:** Modify `src/main.tsx`.

**Consumes:** `syncOnLogin` (Task 3), `getCurrentUser` (Task 2), `installSyncHooks` (Task 4).

- [ ] **Step 1: Подключить в main.tsx**

В `src/main.tsx`, после `installSyncHooks()` и перед/параллельно рендеру: если есть активная сессия — запустить `syncOnLogin()` в фоне (не блокировать рендер):
```ts
import { getCurrentUser } from './auth/auth'
import { syncOnLogin } from './db/sync'
// ...
getCurrentUser().then((u) => { if (u) void syncOnLogin() })
```
(Поставить рядом с `seedCategories().finally(...)`; не блокировать первый рендер — облако догонит асинхронно.)

- [ ] **Step 2: `npm test`, `npm run build`.**

- [ ] **Step 3: Коммит.** `feat: синхронизация при старте при активной сессии`

---

## Task 8: Подключение реального проекта Supabase и проверка вживую (с пользователем)

**Files:** Modify `src/config.ts`. Possibly `.github/workflows/deploy.yml` (если ключи через secrets — НЕ требуется, ключи в config.ts).

- [ ] **Step 1: (Пользователь) Создать проект Supabase** на supabase.com (New project, любое имя, регион поближе, задать пароль БД). Дождаться готовности.

- [ ] **Step 2: (Пользователь, по инструкции ассистента) Создать таблицу + RLS** — в Supabase Dashboard → SQL Editor выполнить:
```sql
create table backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table backups enable row level security;
create policy "own backup only" on backups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

- [ ] **Step 3: (Пользователь) Отключить подтверждение email** (для простоты) — Dashboard → Authentication → Providers → Email → выключить «Confirm email» (иначе после регистрации нужно подтверждать письмо). Передать ассистенту **Project URL** и **anon public key** (Settings → API).

- [ ] **Step 4: Вставить ключи в config.ts**

`src/config.ts` — подставить реальные значения в `SUPABASE_URL` и `SUPABASE_ANON_KEY`.

- [ ] **Step 5: Проверить вживую** (dev-сервер + Playwright или вручную): зарегистрироваться, убедиться что статус «✓ Сохранено в облаке»; изменить рецепт → через ~3с снова синхронизация; проверить в Supabase Dashboard → Table Editor, что в `backups` появился ряд с данными. Затем смоделировать новое устройство (очистить IndexedDB, войти тем же email/паролем) → рецепты подтянулись.

- [ ] **Step 6: `npm run build`, коммит, push (автодеплой).** `feat: подключён проект Supabase`

---

## Проверка соответствия спеке (self-review)

- §2 Supabase / email-auth / last-write-wins → Tasks 1, 2, 3 ✓
- §3 компоненты (config, supabase, auth, sync, AuthSection, SyncStatus, хуки) → Tasks 1-7 ✓
- §4 таблица backups + RLS → Task 8 ✓
- §5 поток (debounced push, pull/push на входе, оффлайн) → Tasks 3, 4, 7 ✓
- §6 безопасность (RLS, anon публичный) → Task 8 (SQL) ✓
- §7 UI (раздел Облако, статус) → Tasks 5, 6 ✓
- §8 нюансы (опционально без конфига, оффлайн) → Task 1 (isCloudConfigured), Task 3 (offline) ✓
- §9 настройка пользователем → Task 8 ✓
- §10 non-goals не реализуются ✓
