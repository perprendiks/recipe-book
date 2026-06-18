import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getRecipe, deleteRecipe, toggleFavorite } from '../db/recipes'
import { addItemsFromRecipe } from '../db/shopping'
import type { Recipe } from '../db/types'
import StarRating from '../components/StarRating'
import { scaleIngredients, formatAmount } from '../lib/scale'

export default function RecipePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null>()
  const [photoUrl, setPhotoUrl] = useState<string>()
  const [servings, setServings] = useState<number | null>(null)
  const [addedToList, setAddedToList] = useState(false)

  useEffect(() => {
    if (id) getRecipe(id).then((r) => {
      const recipe = r ?? null
      setRecipe(recipe)
      if (recipe?.servings != null && recipe.servings > 0) setServings(recipe.servings)
    })
  }, [id])
  useEffect(() => {
    if (!recipe?.photo) { setPhotoUrl(undefined); return }
    const u = URL.createObjectURL(recipe.photo)
    setPhotoUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [recipe?.photo])

  if (recipe === undefined)
    return <div className="p-6 text-center text-ink-soft">Загрузка…</div>
  if (recipe === null)
    return (
      <div className="p-8 text-center flex flex-col items-center gap-2">
        <h1 className="font-display text-xl text-ink">Рецепт не найден</h1>
        <Link to="/" className="text-accent font-semibold text-sm">← К рецептам</Link>
      </div>
    )

  async function onDelete() {
    if (id && confirm('Удалить этот рецепт?')) { await deleteRecipe(id); navigate('/') }
  }
  async function onFav() {
    if (id) { await toggleFavorite(id); setRecipe(await getRecipe(id)) }
  }

  async function onAddToList() {
    if (!recipe) return
    await addItemsFromRecipe(recipe)
    setAddedToList(true)
    setTimeout(() => setAddedToList(false), 3000)
  }

  const meta = [
    recipe.category,
    recipe.timeMinutes != null ? `${recipe.timeMinutes} мин` : null,
    recipe.servings != null ? `${recipe.servings} порц.` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-col">
      {photoUrl && (
        <img src={photoUrl} alt={recipe.title} className="w-full h-60 object-cover" />
      )}

      <div className="px-4 pt-5 pb-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-[28px] leading-tight text-ink">{recipe.title}</h1>
          <button
            onClick={onFav}
            aria-label={recipe.isFavorite ? 'Убрать из избранного' : 'В избранное'}
            className="shrink-0 grid place-items-center w-11 h-11 rounded-full bg-surface border border-border active:scale-90 transition-transform"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={recipe.isFavorite ? 'var(--heart)' : 'none'} stroke="var(--heart)" strokeWidth="1.7" strokeLinejoin="round">
              <path d="M12 20.5 4.5 13a4.5 4.5 0 0 1 6.4-6.3l1.1 1.1 1.1-1.1A4.5 4.5 0 0 1 19.5 13L12 20.5Z" />
            </svg>
          </button>
        </div>

        {meta && <div className="text-sm text-ink-soft -mt-2">{meta}</div>}

        {recipe.rating > 0 && <StarRating value={recipe.rating} size={24} />}

        {recipe.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {recipe.tags.map((t) => (
              <span key={t} className="text-xs font-semibold text-ink-soft bg-surface-sunk rounded-chip px-2.5 py-1">#{t}</span>
            ))}
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="font-display text-lg text-ink">Ингредиенты</h2>
            {recipe.servings != null && recipe.servings > 0 && servings !== null && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setServings((s) => Math.max(1, (s ?? 1) - 1))}
                  aria-label="Уменьшить порции"
                  className="w-9 h-9 rounded-chip border border-border grid place-items-center text-ink active:scale-90 transition-transform bg-surface"
                >
                  −
                </button>
                <span className="font-display text-ink w-8 text-center">{servings}</span>
                <button
                  onClick={() => setServings((s) => (s ?? 1) + 1)}
                  aria-label="Увеличить порции"
                  className="w-9 h-9 rounded-chip border border-border grid place-items-center text-ink active:scale-90 transition-transform bg-surface"
                >
                  +
                </button>
              </div>
            )}
          </div>
          <ul className="flex flex-col gap-1.5">
            {(recipe.servings != null && recipe.servings > 0 && servings !== null
              ? scaleIngredients(recipe.ingredients, servings / recipe.servings)
              : recipe.ingredients
            ).map((i, idx) => (
              <li key={idx} className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-1.5 last:border-0">
                <span className="text-ink">{i.name}</span>
                {i.amount != null && (
                  <span className="text-ink-soft text-sm whitespace-nowrap">
                    {formatAmount(i.amount)} {i.unit}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg text-ink mb-3">Приготовление</h2>
          <ol className="flex flex-col gap-4">
            {recipe.steps.map((s, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="shrink-0 grid place-items-center w-7 h-7 rounded-full bg-accent text-on-accent text-sm font-bold mt-0.5">{idx + 1}</span>
                <p className="text-[17px] leading-relaxed text-ink max-w-[65ch]">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {recipe.notes && (
          <section>
            <h2 className="font-display text-lg text-ink mb-2">Заметки</h2>
            <p className="whitespace-pre-wrap text-ink bg-accent-soft/60 rounded-card px-4 py-3 leading-relaxed">{recipe.notes}</p>
          </section>
        )}

        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex gap-2.5">
            <Link to={`/edit/${recipe.id}`} className="flex-1 text-center bg-accent text-on-accent rounded-chip py-3 font-bold active:scale-[0.98] transition-transform">
              Редактировать
            </Link>
            <button onClick={onDelete} className="px-5 text-danger border border-danger/40 rounded-chip py-3 font-semibold active:scale-[0.98] transition-transform">
              Удалить
            </button>
          </div>
          <button
            onClick={onAddToList}
            className="btn-secondary w-full"
          >
            {addedToList ? '✓ Добавлено в список' : 'В список покупок'}
          </button>
        </div>
      </div>
    </div>
  )
}
