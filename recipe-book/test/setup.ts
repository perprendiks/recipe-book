import '@testing-library/jest-dom'

// Patch structuredClone so that jsdom Blob objects survive fake-indexeddb's
// structured-clone step (jsdom Blobs are custom objects, not native Blobs, so
// the default structuredClone turns them into empty plain objects).
const _origStructuredClone = globalThis.structuredClone
function _deepClonePreservingBlob(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (value instanceof Date) return new Date(value.getTime())
  const v = value as Record<string, unknown>
  if (typeof v['arrayBuffer'] === 'function' && 'size' in v && 'type' in v) {
    return value // Blob-like — return as-is (identity clone)
  }
  if (Array.isArray(value)) return (value as unknown[]).map(_deepClonePreservingBlob)
  const cloned: Record<string, unknown> = {}
  for (const key of Object.keys(v)) cloned[key] = _deepClonePreservingBlob(v[key])
  return cloned
}
function _hasBlobLike(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (typeof v['arrayBuffer'] === 'function' && 'size' in v && 'type' in v) return true
  return Object.values(v).some(_hasBlobLike)
}
globalThis.structuredClone = function patchedStructuredClone<T>(value: T, opts?: StructuredSerializeOptions): T {
  if (_hasBlobLike(value)) return _deepClonePreservingBlob(value) as T
  return _origStructuredClone(value, opts)
}

import 'fake-indexeddb/auto'
