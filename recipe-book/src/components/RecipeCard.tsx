import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { Recipe } from '../db/types'

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!recipe.photo) return
    const u = URL.createObjectURL(recipe.photo)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [recipe.photo])
  return (
    <Link to={`/recipe/${recipe.id}`} className="block rounded-xl overflow-hidden border">
      {url
        ? <img src={url} alt={recipe.title} className="w-full h-32 object-cover" />
        : <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-3xl">🍽️</div>}
      <div className="p-2">
        <div className="font-semibold truncate">{recipe.title}</div>
        <div className="text-xs text-gray-500">
          {recipe.isFavorite ? '❤️ ' : ''}⭐ {recipe.rating} · {recipe.timeMinutes ?? '—'} мин
        </div>
      </div>
    </Link>
  )
}
