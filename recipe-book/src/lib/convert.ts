export interface Converter { id: string; label: string; from: string; to: string; factor: number }

export const CONVERTERS: Converter[] = [
  { id: 'kg', label: 'Килограммы → граммы', from: 'кг', to: 'г', factor: 1000 },
  { id: 'l', label: 'Литры → миллилитры', from: 'л', to: 'мл', factor: 1000 },
  { id: 'tbsp', label: 'Столовые ложки → мл', from: 'ст.л', to: 'мл', factor: 15 },
  { id: 'tsp', label: 'Чайные ложки → мл', from: 'ч.л', to: 'мл', factor: 5 },
  { id: 'cup', label: 'Стаканы → мл', from: 'стакан', to: 'мл', factor: 250 },
]

export function convert(value: number, factor: number): number {
  return Number((value * factor).toFixed(2))
}
