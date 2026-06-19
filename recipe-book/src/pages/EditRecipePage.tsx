import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addRecipe, getRecipe, updateRecipe } from '../db/recipes'
import type { RecipeInput } from '../db/recipes'
import { getCategories } from '../db/categories'
import type { Category } from '../db/types'
import StarRating from '../components/StarRating'
import PhotoPicker from '../components/PhotoPicker'

// В форме количество ингредиента хранится строкой (чтобы можно было вводить
// «0,5», «1/2», запятую и т.п.), а при сохранении конвертируется в число.
interface FormIngredient { name: string; amount: string; unit: string }
interface FormState {
  title: string; category: string; tags: string[]
  ingredients: FormIngredient[]; steps: { text: string }[]
  rating: number; timeMinutes: number | null; servings: number | null
  notes: string; isFavorite: boolean
}

const empty: FormState = {
  title: '', category: '', tags: [], ingredients: [{ name: '', amount: '', unit: '' }],
  steps: [{ text: '' }], rating: 0, timeMinutes: null, servings: null, notes: '', isFavorite: false,
}

// «0,5» / «0.5» -> 0.5 ; пусто или мусор -> null
function parseAmount(raw: string): number | null {
  const t = raw.trim().replace(',', '.')
  if (t === '') return null
  const n = parseFloat(t)
  return isNaN(n) ? null : n
}

export default function EditRecipePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(empty)
  const [photo, setPhoto] = useState<Blob>()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => { getCategories().then(setCategories) }, [])
  useEffect(() => {
    if (!id) return
    getRecipe(id).then((r) => {
      if (!r) return
      const { photo: p } = r
      setForm({
        title: r.title, category: r.category, tags: r.tags,
        ingredients: r.ingredients.length
          ? r.ingredients.map((i) => ({ name: i.name, amount: i.amount == null ? '' : String(i.amount), unit: i.unit }))
          : [{ name: '', amount: '', unit: '' }],
        steps: r.steps.length ? r.steps.map((s) => ({ text: s.text })) : [{ text: '' }],
        rating: r.rating, timeMinutes: r.timeMinutes, servings: r.servings,
        notes: r.notes, isFavorite: r.isFavorite,
      })
      setPhoto(p)
    })
  }, [id])

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))
  const setIngredient = (i: number, patch: Partial<FormIngredient>) =>
    setForm((f) => ({ ...f, ingredients: f.ingredients.map((ing, j) => j === i ? { ...ing, ...patch } : ing) }))
  const removeIngredient = (i: number) =>
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, j) => j !== i) }))
  const setStep = (i: number, text: string) =>
    setForm((f) => ({ ...f, steps: f.steps.map((s, j) => j === i ? { ...s, text } : s) }))
  const removeStep = (i: number) =>
    setForm((f) => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }))

  async function save() {
    const payload: RecipeInput & { photo?: Blob } = {
      title: form.title, category: form.category, tags: form.tags,
      ingredients: form.ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({ name: i.name.trim(), amount: parseAmount(i.amount), unit: i.unit.trim() })),
      steps: form.steps.filter((s) => s.text.trim()).map((s) => ({ text: s.text })),
      rating: form.rating, timeMinutes: form.timeMinutes, servings: form.servings,
      notes: form.notes, isFavorite: form.isFavorite, photo,
    }
    // replace:true — после сохранения свайп «назад» ведёт на список, а не обратно в форму.
    if (id) { await updateRecipe(id, payload); navigate(`/recipe/${id}`, { replace: true }) }
    else { const r = await addRecipe(payload); navigate(`/recipe/${r.id}`, { replace: true }) }
  }

  return (
    <div className="flex flex-col">
      <header className="px-4 pt-6 pb-3">
        <h1 className="font-display text-[26px] text-ink">{id ? 'Редактировать рецепт' : 'Новый рецепт'}</h1>
      </header>

      <div className="px-4 pb-8 flex flex-col gap-5">
        <label className="flex flex-col">
          <span className="field-label">Название</span>
          <input aria-label="Название" className="field" placeholder="Например, Сырники" value={form.title} onChange={(e) => set({ title: e.target.value })} />
        </label>

        <label className="flex flex-col">
          <span className="field-label">Категория</span>
          <select className="field" value={form.category} onChange={(e) => set({ category: e.target.value })}>
            <option value="">— выбрать —</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="field-label">Теги (через запятую)</span>
          <input className="field" placeholder="завтрак, творог" value={form.tags.join(', ')} onChange={(e) => set({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} />
        </label>

        <div className="flex gap-3">
          <label className="flex flex-col flex-1">
            <span className="field-label">Время (мин)</span>
            <input type="number" inputMode="numeric" className="field" value={form.timeMinutes ?? ''} onChange={(e) => set({ timeMinutes: e.target.value ? Number(e.target.value) : null })} />
          </label>
          <label className="flex flex-col flex-1">
            <span className="field-label">Порции</span>
            <input type="number" inputMode="numeric" className="field" value={form.servings ?? ''} onChange={(e) => set({ servings: e.target.value ? Number(e.target.value) : null })} />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="field-label">Ингредиенты</span>
          {form.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input placeholder="Название" className="field flex-1" value={ing.name} onChange={(e) => setIngredient(i, { name: e.target.value })} />
              <input placeholder="Кол-во" inputMode="decimal" className="field w-20 text-center" value={ing.amount} onChange={(e) => setIngredient(i, { amount: e.target.value })} />
              <input placeholder="Ед." className="field w-14 text-center" value={ing.unit} onChange={(e) => setIngredient(i, { unit: e.target.value })} />
              <button
                type="button"
                aria-label="Удалить ингредиент"
                onClick={() => removeIngredient(i)}
                className="shrink-0 grid place-items-center w-9 h-9 rounded-chip text-ink-faint hover:text-danger active:scale-90 transition-transform"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
          ))}
          <button type="button" className="text-accent font-semibold text-sm self-start" onClick={() => set({ ingredients: [...form.ingredients, { name: '', amount: '', unit: '' }] })}>+ ингредиент</button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="field-label">Шаги</span>
          {form.steps.map((s, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="shrink-0 grid place-items-center w-7 h-7 rounded-full bg-accent-soft text-accent text-sm font-bold mt-1.5">{i + 1}</span>
              <textarea rows={2} placeholder={`Шаг ${i + 1}`} className="field flex-1 resize-y" value={s.text} onChange={(e) => setStep(i, e.target.value)} />
              <button
                type="button"
                aria-label="Удалить шаг"
                onClick={() => removeStep(i)}
                className="shrink-0 grid place-items-center w-9 h-9 mt-1 rounded-chip text-ink-faint hover:text-danger active:scale-90 transition-transform"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
          ))}
          <button type="button" className="text-accent font-semibold text-sm self-start" onClick={() => set({ steps: [...form.steps, { text: '' }] })}>+ шаг</button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="field-label">Фото</span>
          <PhotoPicker value={photo} onChange={setPhoto} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="field-label">Оценка</span>
          <StarRating value={form.rating} onChange={(rating) => set({ rating })} />
        </div>

        <label className="flex flex-col">
          <span className="field-label">Заметки / от кого</span>
          <textarea rows={3} className="field resize-y" placeholder="Бабушкин рецепт, секреты…" value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
        </label>

        <button type="button" className="btn-primary mt-1" onClick={save} disabled={!form.title.trim()}>Сохранить</button>
      </div>
    </div>
  )
}
