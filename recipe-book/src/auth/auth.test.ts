import { describe, expect, test, vi, beforeEach } from 'vitest'

const mockAuth = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
}))
vi.mock('../db/supabase', () => ({ supabase: { auth: mockAuth }, isCloudConfigured: () => true }))

import { signIn, signUp, getCurrentUser } from './auth'

beforeEach(() => vi.clearAllMocks())

test('signUp возвращает пользователя при успехе', async () => {
  mockAuth.signUp.mockResolvedValue({ data: { user: { id: 'u2', email: 'x@y.z' } }, error: null })
  const r = await signUp('x@y.z', 'pw')
  expect(r.user).toEqual({ id: 'u2', email: 'x@y.z' })
  expect(r.error).toBeNull()
})

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
