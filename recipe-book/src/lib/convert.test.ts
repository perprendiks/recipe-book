import { expect, test } from 'vitest'
import { convert } from './convert'

test('convert умножает и округляет', () => {
  expect(convert(2, 1000)).toBe(2000)
  expect(convert(3, 15)).toBe(45)
  expect(convert(1.5, 250)).toBe(375)
})

test('convert дробное значение', () => {
  expect(convert(0.333, 1000)).toBe(333)
})
