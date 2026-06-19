import { useEffect, useMemo, useState } from 'react'
import { getAllRecipes } from '../db/recipes'
import { getCategories } from '../db/categories'
import type { Recipe, Category } from '../db/types'
import RecipeCard from '../components/RecipeCard'

// Фильтры храним в sessionStorage, чтобы они не сбрасывались при возврате
// со страницы рецепта (например, остаёшься в категории «Салаты»).
const SS = { q: 'home.query', cat: 'home.cat', fav: 'home.favOnly' }

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [query, setQuery] = useState(() => sessionStorage.getItem(SS.q) ?? '')
  const [cat, setCat] = useState<string>(() => sessionStorage.getItem(SS.cat) ?? '')
  const [favOnly, setFavOnly] = useState(() => sessionStorage.getItem(SS.fav) === '1')

  useEffect(() => {
    getAllRecipes().then(setRecipes)
    getCategories().then(setCategories)
  }, [])

  useEffect(() => { sessionStorage.setItem(SS.q, query) }, [query])
  useEffect(() => { sessionStorage.setItem(SS.cat, cat) }, [cat])
  useEffect(() => { sessionStorage.setItem(SS.fav, favOnly ? '1' : '0') }, [favOnly])

  const filtered = useMemo(() => recipes.filter((r) =>
    r.title.toLowerCase().includes(query.toLowerCase()) &&
    (cat ? r.category === cat : true) &&
    (favOnly ? r.isFavorite : true),
  ), [recipes, query, cat, favOnly])

  const isFiltering = query.trim() !== '' || cat !== '' || favOnly
  const chip = (active: boolean) =>
    `px-3.5 py-1.5 rounded-chip text-sm whitespace-nowrap border transition-colors duration-150 ${
      active ? 'bg-accent-soft border-accent-soft text-accent font-bold' : 'bg-surface border-border text-ink-soft'
    }`

  return (
    <div className="flex flex-col">
      <header className="px-4 pt-6 pb-3">
        <h1 className="font-display text-[27px] text-ink">Мои рецепты</h1>
      </header>

      <div className="px-4 flex flex-col gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
          <input
            className="w-full bg-surface border border-border rounded-card pl-10 pr-3 py-3 text-[15px] text-ink placeholder:text-ink-faint focus:border-accent outline-none transition-colors"
            placeholder="Поиск рецептов"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button onClick={() => setCat('')} className={chip(cat === '')}>Все</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setCat(c.name)} className={chip(cat === c.name)}>{c.name}</button>
          ))}
        </div>

        <label className="flex items-center gap-2.5 text-sm text-ink-soft select-none w-fit">
          <input
            type="checkbox"
            checked={favOnly}
            onChange={(e) => setFavOnly(e.target.checked)}
            className="w-4 h-4 rounded accent-[var(--accent)]"
          />
          <span className="inline-flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--heart)"><path d="M12 20.5 4.5 13a4.5 4.5 0 0 1 6.4-6.3l1.1 1.1 1.1-1.1A4.5 4.5 0 0 1 19.5 13L12 20.5Z" /></svg>
            Только избранное
          </span>
        </label>
      </div>

      <div className="px-4 pt-4 pb-6">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5">
            {filtered.map((r) => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        ) : isFiltering ? (
          <EmptyState
            title="Ничего не нашлось"
            text="Попробуй изменить поиск или фильтры."
          />
        ) : (
          <EmptyState
            title="Здесь появятся твои рецепты"
            text="Добавь первый рецепт или загрузи их из файла в Настройках."
          />
        )}
      </div>
    </div>
  )
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-12 flex flex-col items-center text-center px-6">
      <div className="w-16 h-16 rounded-full bg-accent-soft grid place-items-center mb-4">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.5" /></svg>
      </div>
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <p className="mt-1.5 text-sm text-ink-soft max-w-[15rem]">{text}</p>
    </div>
  )
}
