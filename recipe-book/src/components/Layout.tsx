import { Link, Outlet, useLocation } from 'react-router-dom'

export default function Layout() {
  const { pathname } = useLocation()
  const tab = (to: string, label: string) => (
    <Link to={to} className={`flex-1 text-center py-3 text-sm ${pathname === to ? 'font-bold' : 'text-gray-500'}`}>
      {label}
    </Link>
  )
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">
      <main className="flex-1 pb-16"><Outlet /></main>
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex">
        {tab('/', 'Рецепты')}
        {tab('/add', 'Добавить')}
        {tab('/settings', 'Настройки')}
      </nav>
    </div>
  )
}
