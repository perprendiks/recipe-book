import { expect, test } from 'vitest'
import { isCloudConfigured } from './supabase'

test('isCloudConfigured false при пустом конфиге', () => {
  expect(isCloudConfigured()).toBe(false)
})
