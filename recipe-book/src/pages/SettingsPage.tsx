import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { downloadBackup, parseBackupFile, importBackup } from '../db/backup'
import { getCategories, addCategory, renameCategory, deleteCategory } from '../db/categories'
import type { Category } from '../db/types'
import UnitConverter from '../components/UnitConverter'
import AuthSection from '../components/AuthSection'

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCat, setNewCat] = useState('')
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)
  const [replaceMode, setReplaceMode] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reload = () => getCategories().then(setCategories)
  useEffect(() => { reload() }, [])

  async function onImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const backup = parseBackupFile(text)
      await importBackup(backup, replaceMode ? 'replace' : 'merge')
      await reload()
      setIsError(false)
      setMsg(`Импортировано рецептов: ${backup.recipes.length}`)
    } catch {
      setIsError(true)
      setMsg('Ошибка: не удалось прочитать файл бэкапа')
    }
  }

  return (
    <div className="flex flex-col">
      <header className="px-4 pt-6 pb-3">
        <h1 className="font-display text-[26px] text-ink">Настройки</h1>
      </header>

      <div className="px-4 pb-8 flex flex-col gap-7">
        <AuthSection />

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="section-title">Резервная копия</h2>
            <p className="text-sm text-ink-soft mt-0.5">Рецепты хранятся в телефоне. Сохраняй копию, чтобы ничего не потерять.</p>
          </div>
          <button onClick={() => downloadBackup()} className="btn-primary">Сохранить копию</button>

          <div className="bg-surface border border-border rounded-card p-3 flex flex-col gap-3">
            <input ref={fileRef} type="file" accept="application/json,.json" aria-label="Загрузить файл бэкапа" className="sr-only" onChange={onImport} />
            <button onClick={() => fileRef.current?.click()} className="btn-secondary">Загрузить из файла</button>
            <label className="flex items-center gap-2.5 text-sm text-ink-soft select-none">
              <input type="checkbox" checked={replaceMode} onChange={(e) => setReplaceMode(e.target.checked)} aria-label="Заменить всю коллекцию" className="w-4 h-4 rounded accent-[var(--accent)]" />
              Заменить всю коллекцию
            </label>
          </div>

          {msg && (
            <p className={`text-sm rounded-chip px-3 py-2 ${isError ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>{msg}</p>
          )}
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className="section-title">Категории</h2>
          {categories.map((c) => (
            <div key={c.id} className="flex gap-2 items-center">
              <input
                className="field flex-1"
                value={c.name}
                onChange={async (e) => { const name = e.target.value; await renameCategory(c.id, name); setCategories(cs => cs.map(x => x.id === c.id ? { ...x, name } : x)) }}
              />
              <button
                onClick={async () => { await deleteCategory(c.id); await reload() }}
                aria-label={`Удалить категорию ${c.name}`}
                className="shrink-0 grid place-items-center w-10 h-10 rounded-chip text-danger border border-danger/30 active:scale-95 transition-transform"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 7h14M10 7V5h4v2M8 7l.7 12h6.6L16 7" /></svg>
              </button>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <input className="field flex-1" placeholder="Новая категория" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <button
              onClick={async () => { if (newCat.trim()) { await addCategory(newCat.trim()); setNewCat(''); await reload() } }}
              className="shrink-0 px-5 bg-accent text-on-accent rounded-chip font-bold active:scale-95 transition-transform"
            >
              +
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="section-title">Конвертер единиц</h2>
          <UnitConverter />
        </section>
      </div>
    </div>
  )
}
