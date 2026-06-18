import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import RecipePage from './pages/RecipePage'
import EditRecipePage from './pages/EditRecipePage'
import SettingsPage from './pages/SettingsPage'
import ShoppingPage from './pages/ShoppingPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipe/:id" element={<RecipePage />} />
        <Route path="/add" element={<EditRecipePage />} />
        <Route path="/edit/:id" element={<EditRecipePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/shopping" element={<ShoppingPage />} />
      </Route>
    </Routes>
  )
}
