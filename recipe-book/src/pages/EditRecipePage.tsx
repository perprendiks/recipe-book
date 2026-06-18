import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addRecipe, getRecipe, updateRecipe } from '../db/recipes'
import type { RecipeInput } from '../db/recipes'
import { getCategories } from '../db/categories'
import type { Category, Ingredient, Step } from '../db/types'
import StarRating from '../components/StarRating'
import PhotoPicker from '../components/PhotoPicker'

const empty: RecipeInput = {
  title: '', category: '', tags: [], ingredients: [{ name: '', amount: null, unit: '' }],
  steps: [{ text: '' }], rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false,
}

export default function EditRecipePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<RecipeInput>(empty)
  const [photo, setPhoto] = useState<Blob>()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => { getCategories().then(setCategories) }, [])
  useEffect(() => {
    if (!id) return
    getRecipe(id).then((r) => {
      if (r) {
        const { photo: p, id: _id, createdAt, updatedAt, ...rest } = r
        setForm(rest)
        setPhoto(p)
      }
    })
  }, [id])

  const set = (patch: Partial<RecipeInput>) => setForm((f) => ({ ...f, ...patch }))
  const setIngredient = (i: number, patch: Partial<Ingredient>) =>
    set({ ingredients: form.ingredients.map((ing, j) => j === i ? { ...ing, ...patch } : ing) })
  const setStep = (i: number, text: string) =>
    set({ steps: form.steps.map((s: Step, j) => j === i ? { ...s, text } : s) })

  async function save() {
    const data: RecipeInput = { ...form, ingredients: form.ingredients.filter(i => i.name.trim()), steps: form.steps.filter(s => s.text.trim()) }
    const payload = { ...data, photo }
    if (id) { await updateRecipe(id, payload); navigate(`/recipe/${id}`) }
    else { const r = await addRecipe(payload); navigate(`/recipe/${r.id}`) }
  }

  return (
    <div className="p-3 flex flex-col gap-4">
      <label className="flex flex-col gap-1">Название
        <input aria-label="Название" className="border rounded px-3 py-2" value={form.title} onChange={(e) => set({ title: e.target.value })} />
      </label>

      <label className="flex flex-col gap-1">Категория
        <select className="border rounded px-3 py-2" value={form.category} onChange={(e) => set({ category: e.target.value })}>
          <option value="">— выбрать —</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1">Теги (через запятую)
        <input className="border rounded px-3 py-2" value={form.tags.join(', ')} onChange={(e) => set({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} />
      </label>

      <div className="flex gap-2">
        <label className="flex flex-col gap-1 flex-1">Время (мин)
          <input type="number" className="border rounded px-3 py-2" value={form.timeMinutes ?? ''} onChange={(e) => set({ timeMinutes: e.target.value ? Number(e.target.value) : null })} />
        </label>
        <label className="flex flex-col gap-1 flex-1">Порции
          <input type="number" className="border rounded px-3 py-2" value={form.servings ?? ''} onChange={(e) => set({ servings: e.target.value ? Number(e.target.value) : null })} />
        </label>
      </div>

      <div className="flex flex-col gap-1">Ингредиенты
        {form.ingredients.map((ing, i) => (
          <div key={i} className="flex gap-1">
            <input placeholder="Название" className="border rounded px-2 py-1 flex-1" value={ing.name} onChange={(e) => setIngredient(i, { name: e.target.value })} />
            <input placeholder="Кол-во" className="border rounded px-2 py-1 w-20" value={ing.amount ?? ''} onChange={(e) => setIngredient(i, { amount: e.target.value ? Number(e.target.value) : null })} />
            <input placeholder="Ед." className="border rounded px-2 py-1 w-16" value={ing.unit} onChange={(e) => setIngredient(i, { unit: e.target.value })} />
          </div>
        ))}
        <button type="button" className="text-sm text-blue-600 self-start" onClick={() => set({ ingredients: [...form.ingredients, { name: '', amount: null, unit: '' }] })}>+ ингредиент</button>
      </div>

      <div className="flex flex-col gap-1">Шаги
        {form.steps.map((s, i) => (
          <textarea key={i} placeholder={`Шаг ${i + 1}`} className="border rounded px-2 py-1" value={s.text} onChange={(e) => setStep(i, e.target.value)} />
        ))}
        <button type="button" className="text-sm text-blue-600 self-start" onClick={() => set({ steps: [...form.steps, { text: '' }] })}>+ шаг</button>
      </div>

      <div className="flex flex-col gap-1">Фото
        <PhotoPicker value={photo} onChange={setPhoto} />
      </div>

      <div className="flex flex-col gap-1">Оценка
        <StarRating value={form.rating} onChange={(rating) => set({ rating })} />
      </div>

      <label className="flex flex-col gap-1">Заметки / от кого
        <textarea className="border rounded px-3 py-2" value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
      </label>

      <button type="button" className="bg-black text-white rounded-lg py-3 font-semibold" onClick={save} disabled={!form.title.trim()}>Сохранить</button>
    </div>
  )
}
