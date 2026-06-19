import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { seedCategories } from './db/categories'
import { seedRecipesIfEmpty } from './db/seed'
import { installSyncHooks } from './db/syncHooks'
import { syncOnLogin } from './db/sync'

// Вешаем авто-синхронизацию на изменения данных (без облака — просто no-op).
installSyncHooks()

seedCategories().then(() => seedRecipesIfEmpty()).finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>,
  )
  // Если пользователь уже вошёл — подтянуть/отправить данные при старте.
  void syncOnLogin()
})
