import { Link, Outlet, useLocation } from 'react-router-dom'

type IconName = 'recipes' | 'add' | 'settings' | 'shopping'

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  if (name === 'recipes')
    return (
      <svg {...common}>
        <path d="M5 4.5h10a2 2 0 0 1 2 2V19a1.5 1.5 0 0 0-1.5-1.5H5A.5.5 0 0 1 4.5 17V5A.5.5 0 0 1 5 4.5Z" />
        <path d="M8.5 8.5h5M8.5 11.5h5" />
      </svg>
    )
  if (name === 'add')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8.5v7M8.5 12h7" />
      </svg>
    )
  if (name === 'settings')
    return (
      <svg {...common}>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle cx="16" cy="7" r="2.2" />
        <circle cx="8" cy="17" r="2.2" />
      </svg>
    )
  return (
    <svg {...common}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  const tab = (to: string, label: string, icon: IconName) => {
    const active = pathname === to
    return (
      <Link
        to={to}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors duration-200 ${
          active ? 'text-accent' : 'text-ink-faint'
        }`}
      >
        <Icon name={icon} />
        <span className={`text-[11px] ${active ? 'font-bold' : 'font-semibold'}`}>{label}</span>
      </Link>
    )
  }
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-bg">
      <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface/95 backdrop-blur-sm border-t border-border flex pb-[env(safe-area-inset-bottom)]">
        {tab('/', 'Рецепты', 'recipes')}
        {tab('/add', 'Добавить', 'add')}
        {tab('/shopping', 'Покупки', 'shopping')}
        {tab('/settings', 'Настройки', 'settings')}
      </nav>
    </div>
  )
}
