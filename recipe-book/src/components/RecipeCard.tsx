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
    <Link
      to={`/recipe/${recipe.id}`}
      className="group block rounded-photo overflow-hidden bg-surface border border-border shadow-sm transition-transform duration-200 ease-out-expo active:scale-[0.98]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {url ? (
          <img
            src={url}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-300 ease-out-expo group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-accent-soft flex items-center justify-center">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
              <circle cx="12" cy="12" r="8.5" />
              <circle cx="12" cy="12" r="3.5" />
            </svg>
          </div>
        )}
        {recipe.isFavorite && (
          <span className="absolute top-2 right-2 grid place-items-center w-7 h-7 rounded-full bg-bg/85 backdrop-blur-sm shadow-sm" aria-label="В избранном">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--heart)" stroke="var(--heart)" strokeWidth="1.5">
              <path d="M12 20.5 4.5 13a4.5 4.5 0 0 1 6.4-6.3l1.1 1.1 1.1-1.1A4.5 4.5 0 0 1 19.5 13L12 20.5Z" />
            </svg>
          </span>
        )}
      </div>
      <div className="px-3 pt-2 pb-3">
        <h3 className="font-display text-[17px] leading-snug text-ink truncate">{recipe.title}</h3>
        <div className="mt-1 flex items-center gap-2 text-[13px] text-ink-soft">
          {recipe.rating > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--star)"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z" /></svg>
              {recipe.rating}
            </span>
          )}
          {recipe.timeMinutes != null && (
            <span className="inline-flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.8" /></svg>
              {recipe.timeMinutes} мин
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
