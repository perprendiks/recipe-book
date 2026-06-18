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
