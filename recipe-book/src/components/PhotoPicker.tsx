import { useEffect, useState } from 'react'

export default function PhotoPicker({ value, onChange }: { value?: Blob; onChange: (b: Blob | undefined) => void }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!value) { setUrl(undefined); return }
    const u = URL.createObjectURL(value)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [value])
  return (
    <div className="flex flex-col gap-2">
      {url && <img src={url} alt="Фото блюда" className="w-full h-48 object-cover rounded-xl" />}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      {url && <button type="button" className="text-sm text-red-500" onClick={() => onChange(undefined)}>Удалить фото</button>}
    </div>
  )
}
