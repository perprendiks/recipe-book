import { expect, test, vi } from 'vitest'

vi.mock('../db/supabase', () => ({ supabase: null, isCloudConfigured: () => false }))

import { signIn, signUp, getCurrentUser, onAuthChange } from './auth'

test('signIn без облака возвращает безопасный дефолт', async () => {
  const r = await signIn('a@b.c', 'pw')
  expect(r.user).toBeNull()
  expect(r.error).toBe('Облако не настроено')
})

test('signUp без облака возвращает безопасный дефолт', async () => {
  const r = await signUp('a@b.c', 'pw')
  expect(r.user).toBeNull()
  expect(r.error).toBe('Облако не настроено')
})

test('getCurrentUser без облака возвращает null', async () => {
  expect(await getCurrentUser()).toBeNull()
})

test('onAuthChange без облака возвращает no-op отписку', () => {
  const unsub = onAuthChange(() => {})
  expect(typeof unsub).toBe('function')
  unsub() // не должно бросить
})
