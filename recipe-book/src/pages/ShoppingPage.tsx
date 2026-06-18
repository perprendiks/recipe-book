import { useEffect, useState, useRef } from 'react'
import { getShoppingList, addManualItem, toggleItem, removeItem, clearChecked } from '../db/shopping'
import type { ShoppingItem } from '../db/types'

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function refresh() {
    setItems(await getShoppingList())
  }

  useEffect(() => { refresh() }, [])

  async function onAdd() {
    const name = input.trim()
    if (!name) return
    await addManualItem(name)
    setInput('')
    await refresh()
    inputRef.current?.focus()
  }

  async function onToggle(id: string) {
    await toggleItem(id)
    await refresh()
  }

  async function onRemove(id: string) {
    await removeItem(id)
    await refresh()
  }

  async function onClearChecked() {
    await clearChecked()
    await refresh()
  }

  const hasChecked = items.some((i) => i.checked)

  return (
    <div className="px-4 pt-6 pb-8 flex flex-col gap-5 max-w-md mx-auto">
      <h1 className="font-display text-[28px] leading-tight text-ink">Список покупок</h1>

      {/* Manual add */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder="Добавить вручную…"
          className="field flex-1"
        />
        <button
          onClick={onAdd}
          disabled={!input.trim()}
          className="btn-primary px-4 disabled:opacity-40"
        >
          +
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-ink-faint">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <p className="text-ink-soft font-semibold text-lg">Список пуст</p>
          <p className="text-ink-faint text-sm">Добавьте продукты вручную или через рецепт</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 py-2.5 border-b border-border/60 last:border-0"
            >
              <button
                onClick={() => onToggle(item.id)}
                aria-label={item.checked ? 'Убрать отметку' : 'Отметить купленным'}
                className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  item.checked
                    ? 'bg-accent border-accent text-on-accent'
                    : 'border-border bg-surface'
                }`}
              >
                {item.checked && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-[17px] ${item.checked ? 'line-through text-ink-faint' : 'text-ink'}`}>
                {item.name}
                {item.amount != null && (
                  <span className="text-ink-soft text-sm ml-1.5">{item.amount}{item.unit ? ` ${item.unit}` : ''}</span>
                )}
              </span>
              <button
                onClick={() => onRemove(item.id)}
                aria-label="Удалить"
                className="shrink-0 w-8 h-8 grid place-items-center text-ink-faint hover:text-danger active:scale-90 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Clear checked */}
      {hasChecked && (
        <button onClick={onClearChecked} className="btn-secondary self-start mt-1">
          Очистить купленное
        </button>
      )}
    </div>
  )
}
