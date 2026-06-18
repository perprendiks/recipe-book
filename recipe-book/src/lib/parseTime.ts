export function parseMinutes(text: string): number | null {
  const m = text.match(/(\d+)\s*(?:-\s*\d+\s*)?мин/i)
  return m ? Number(m[1]) : null
}
