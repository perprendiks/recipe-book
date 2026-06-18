import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { downloadBackup, parseBackupFile, importBackup } from '../db/backup'
import { getCategories, addCategory, renameCategory, deleteCategory } from '../db/categories'
import type { Category } from '../db/types'

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCat, setNewCat] = useState('')
  const [msg, setMsg] = useState('')

  const reload = () => getCategories().then(setCategories)
  useEffect(() => { reload() }, [])

  async function onImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const backup = parseBackupFile(text)
      await importBackup(backup, 'merge')
      await reload()
      setMsg(`Импортировано рецептов: ${backup.recipes.length}`)
    } catch (err) {
      setMsg('Ошибка: не удалось прочитать файл бэкапа')
    }
  }

  return (
    <div className="p-3 flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Резервная копия</h2>
        <button onClick={() => downloadBackup()} className="bg-black text-white rounded-lg py-2">Сохранить копию (бэкап)</button>
        <label className="flex flex-col gap-1 text-sm">Загрузить файл бэкапа
          <input type="file" accept="application/json,.json" aria-label="Загрузить файл бэкапа" onChange={onImport} />
        </label>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Категории</h2>
        {categories.map((c) => (
          <div key={c.id} className="flex gap-2 items-center">
            <input className="border rounded px-2 py-1 flex-1" value={c.name} onChange={(e) => { renameCategory(c.id, e.target.value); setCategories(cs => cs.map(x => x.id === c.id ? { ...x, name: e.target.value } : x)) }} />
            <button onClick={async () => { await deleteCategory(c.id); reload() }} className="text-red-500 text-sm">Удалить</button>
          </div>
        ))}
        <div className="flex gap-2">
          <input className="border rounded px-2 py-1 flex-1" placeholder="Новая категория" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <button onClick={async () => { if (newCat.trim()) { await addCategory(newCat.trim()); setNewCat(''); reload() } }} className="border rounded px-3">+</button>
        </div>
      </section>
    </div>
  )
}
