import { useState } from 'react'
import { CONVERTERS, convert } from '../lib/convert'

export default function UnitConverter() {
  const [selectedId, setSelectedId] = useState(CONVERTERS[0].id)
  const [raw, setRaw] = useState('')

  const selected = CONVERTERS.find((c) => c.id === selectedId) ?? CONVERTERS[0]
  const num = parseFloat(raw)
  const result = !isNaN(num) && raw !== '' && num >= 0 ? convert(num, selected.factor) : null

  return (
    <div className="flex flex-col gap-3">
      <select
        className="field"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        aria-label="Тип конвертации"
      >
        {CONVERTERS.map((c) => (
          <option key={c.id} value={c.id}>{c.label}</option>
        ))}
      </select>

      <input
        className="field"
        type="number"
        min="0"
        placeholder={`Введите значение в ${selected.from}`}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        aria-label={`Значение в ${selected.from}`}
      />

      {result !== null && (
        <p className="rounded-chip bg-surface border border-border px-4 py-2 text-ink text-sm font-medium">
          {num} {selected.from} = {result} {selected.to}
        </p>
      )}
    </div>
  )
}
