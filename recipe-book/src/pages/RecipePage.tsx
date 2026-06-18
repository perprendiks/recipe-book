import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getRecipe, deleteRecipe, toggleFavorite } from '../db/recipes'
import type { Recipe } from '../db/types'
import StarRating from '../components/StarRating'

export default function RecipePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe>()
  const [photoUrl, setPhotoUrl] = useState<string>()

  useEffect(() => { if (id) getRecipe(id).then(setRecipe) }, [id])
  useEffect(() => {
    if (!recipe?.photo) { setPhotoUrl(undefined); return }
    const u = URL.createObjectURL(recipe.photo)
    setPhotoUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [recipe?.photo])

  if (!recipe) return <div className="p-4">Загрузка…</div>

  async function onDelete() {
    if (id && confirm('Удалить рецепт?')) { await deleteRecipe(id); navigate('/') }
  }
  async function onFav() {
    if (id) { await toggleFavorite(id); setRecipe(await getRecipe(id)) }
  }

  return (
    <div className="p-3 flex flex-col gap-4">
      {photoUrl && <img src={photoUrl} alt={recipe.title} className="w-full h-56 object-cover rounded-xl" />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{recipe.title}</h1>
        <button onClick={onFav} aria-label="В избранное" className="text-2xl">{recipe.isFavorite ? '❤️' : '🤍'}</button>
      </div>
      <div className="text-sm text-gray-600">{recipe.category} · {recipe.timeMinutes ?? '—'} мин · {recipe.servings ?? '—'} порц.</div>
      <StarRating value={recipe.rating} />
      {recipe.tags.length > 0 && <div className="flex gap-2 flex-wrap">{recipe.tags.map(t => <span key={t} className="text-xs bg-gray-100 rounded-full px-2 py-1">#{t}</span>)}</div>}

      <section>
        <h2 className="font-semibold mb-1">Ингредиенты</h2>
        <ul className="list-disc pl-5">
          {recipe.ingredients.map((i, idx) => <li key={idx}>{i.name}{i.amount != null ? ` — ${i.amount} ${i.unit}` : ''}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-1">Приготовление</h2>
        <ol className="list-decimal pl-5 flex flex-col gap-1">
          {recipe.steps.map((s, idx) => <li key={idx}>{s.text}</li>)}
        </ol>
      </section>

      {recipe.notes && <section><h2 className="font-semibold mb-1">Заметки</h2><p className="whitespace-pre-wrap">{recipe.notes}</p></section>}

      <div className="flex gap-2">
        <Link to={`/edit/${recipe.id}`} className="flex-1 text-center border rounded-lg py-2">Редактировать</Link>
        <button onClick={onDelete} className="flex-1 text-red-600 border border-red-200 rounded-lg py-2">Удалить</button>
      </div>
    </div>
  )
}
