import { afterEach, expect, test, vi } from 'vitest'

afterEach(() => { vi.resetModules(); vi.doUnmock('../config') })

test('isCloudConfigured true при заполненном конфиге', async () => {
  vi.resetModules()
  vi.doMock('../config', () => ({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'key' }))
  const { isCloudConfigured } = await import('./supabase')
  expect(isCloudConfigured()).toBe(true)
})

test('isCloudConfigured false при пустом конфиге', async () => {
  vi.resetModules()
  vi.doMock('../config', () => ({ SUPABASE_URL: '', SUPABASE_ANON_KEY: '' }))
  const { isCloudConfigured } = await import('./supabase')
  expect(isCloudConfigured()).toBe(false)
})
