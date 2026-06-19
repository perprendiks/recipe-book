import { db } from './db'
import { scheduleSync } from './sync'

// Любое изменение рецептов или категорий запускает отложенную синхронизацию
// в облако. Так мы ловим ВСЕ мутации в одном месте, не правя каждую функцию.
let installed = false

export function installSyncHooks(): void {
  if (installed) return
  installed = true
  for (const table of [db.recipes, db.categories]) {
    table.hook('creating', () => { scheduleSync() })
    table.hook('updating', () => { scheduleSync() })
    table.hook('deleting', () => { scheduleSync() })
  }
}
