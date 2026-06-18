import { useEffect, useMemo, useState } from 'react'
import { getAllRecipes } from '../db/recipes'
import { getCategories } from '../db/categories'
import type { Recipe, Category } from '../db/types'
import RecipeCard from '../components/RecipeCard'

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<string>('')
  const [favOnly, setFavOnly] = useState(false)

  useEffect(() => {
    getAllRecipes().then(setRecipes)
    getCategories().then(setCategories)
  }, [])

  const filtered = useMemo(() => recipes.filter((r) =>
    r.title.toLowerCase().includes(query.toLowerCase()) &&
    (cat ? r.category === cat : true) &&
    (favOnly ? r.isFavorite : true),
  ), [recipes, query, cat, favOnly])

  return (
    <div className="p-3 flex flex-col gap-3">
      <input
        className="w-full border rounded-lg px-3 py-2"
        placeholder="Поиск рецептов"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="flex gap-2 overflow-x-auto">
        <button onClick={() => setCat('')} className={`px-3 py-1 rounded-full border text-sm ${cat === '' ? 'bg-black text-white' : ''}`}>Все</button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setCat(c.name)} className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${cat === c.name ? 'bg-black text-white' : ''}`}>{c.name}</button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={favOnly} onChange={(e) => setFavOnly(e.target.checked)} />
        Только избранное
      </label>
      {filtered.length === 0
        ? <p className="text-center text-gray-400 mt-10">Пока нет рецептов. Добавь первый! 🍳</p>
        : <div className="grid grid-cols-2 gap-3">{filtered.map((r) => <RecipeCard key={r.id} recipe={r} />)}</div>}
    </div>
  )
}
