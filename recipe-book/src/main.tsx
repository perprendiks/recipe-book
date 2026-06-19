import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { db } from './db/db'
import { seedCategories } from './db/categories'
import { seedRecipesIfEmpty } from './db/seed'
import { installSyncHooks } from './db/syncHooks'
import { syncOnLogin } from './db/sync'

// Вешаем авто-синхронизацию на изменения данных (без облака — просто no-op).
installSyncHooks()

async function bootstrap() {
  try {
    // Последовательно и с явным открытием БД — иначе на холодном старте
    // (первый заход, БД создаётся впервые) категории и предустановка гонятся.
    await db.open()
    await seedCategories()
    await seedRecipesIfEmpty()
  } catch (e) {
    console.error('Ошибка инициализации:', e)
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>,
  )

  // Если пользователь уже вошёл — подтянуть/отправить данные при старте.
  void syncOnLogin()
}

void bootstrap()
