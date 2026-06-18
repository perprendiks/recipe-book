import { expect, test } from 'vitest'
import { parseMinutes } from './parseTime'

test('parseMinutes извлекает минуты', () => {
  expect(parseMinutes('варить 10 минут')).toBe(10)
  expect(parseMinutes('запекать 20-25 мин')).toBe(20)
  expect(parseMinutes('перемешать')).toBeNull()
})
