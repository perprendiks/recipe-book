import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import RecipePage from './pages/RecipePage'
import EditRecipePage from './pages/EditRecipePage'
import SettingsPage from './pages/SettingsPage'
import { seedCategories } from './db/categories'

export default function App() {
  useEffect(() => { seedCategories() }, [])
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipe/:id" element={<RecipePage />} />
        <Route path="/add" element={<EditRecipePage />} />
        <Route path="/edit/:id" element={<EditRecipePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
