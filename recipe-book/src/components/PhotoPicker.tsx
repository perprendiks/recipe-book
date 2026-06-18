import { useEffect, useRef, useState } from 'react'

export default function PhotoPicker({ value, onChange }: { value?: Blob; onChange: (b: Blob | undefined) => void }) {
  const [url, setUrl] = useState<string>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!value) { setUrl(undefined); return }
    const u = URL.createObjectURL(value)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [value])

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      {url ? (
        <div className="flex flex-col gap-2">
          <img src={url} alt="Фото блюда" className="w-full h-52 object-cover rounded-photo border border-border" />
          <div className="flex gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="flex-1 py-2 rounded-chip border border-border text-ink-soft text-sm font-semibold active:scale-[0.98] transition-transform">
              Заменить
            </button>
            <button type="button" onClick={() => onChange(undefined)} className="flex-1 py-2 rounded-chip border border-danger/40 text-danger text-sm font-semibold active:scale-[0.98] transition-transform">
              Удалить
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-36 rounded-photo border-2 border-dashed border-border bg-surface-sunk grid place-items-center text-ink-faint active:scale-[0.99] transition-transform"
        >
          <span className="flex flex-col items-center gap-1.5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2l1-1.6A1 1 0 0 1 9.5 4h5a1 1 0 0 1 .8.4l1 1.6h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-8Z" />
              <circle cx="12" cy="12" r="3.2" />
            </svg>
            <span className="text-sm font-semibold">Добавить фото</span>
          </span>
        </button>
      )}
    </div>
  )
}
