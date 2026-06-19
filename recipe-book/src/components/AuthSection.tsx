import { useEffect, useState } from 'react'
import { isCloudConfigured } from '../db/supabase'
import { signIn, signUp, signOut, onAuthChange, type AuthUser } from '../auth/auth'
import { syncOnLogin } from '../db/sync'
import SyncStatus from './SyncStatus'

export default function AuthSection() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => onAuthChange(setUser), [])

  // Облако не настроено (нет ключей) — раздел просто не показываем.
  if (!isCloudConfigured()) return null

  async function submit(mode: 'in' | 'up') {
    if (!email.trim() || !password) { setMsg('Введи почту и пароль'); return }
    setBusy(true); setMsg('')
    const { user: u, error } = mode === 'in'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password)
    setBusy(false)
    if (error) { setMsg(error); return }
    setPassword('')
    if (u) { setUser(u); await syncOnLogin() }
    else setMsg('Почти готово! Проверь почту и подтверди регистрацию.')
  }

  if (user) {
    return (
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="section-title">Облако</h2>
          <p className="text-sm text-ink-soft mt-0.5">Рецепты автоматически сохраняются в облако.</p>
        </div>
        <div className="bg-surface border border-border rounded-card p-3 flex flex-col gap-3">
          <p className="text-sm text-ink">Вход выполнен: <span className="font-semibold">{user.email}</span></p>
          <SyncStatus />
          <button onClick={async () => { await signOut(); setUser(null) }} className="btn-secondary">Выйти</button>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="section-title">Облако (автобэкап)</h2>
        <p className="text-sm text-ink-soft mt-0.5">Войди, чтобы рецепты сохранялись в облако и восстанавливались на новом телефоне.</p>
      </div>
      <div className="bg-surface border border-border rounded-card p-3 flex flex-col gap-3">
        <input className="field" type="email" inputMode="email" autoComplete="email" placeholder="Почта" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Почта" />
        <input className="field" type="password" autoComplete="current-password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Пароль" />
        <div className="flex gap-2">
          <button onClick={() => submit('in')} disabled={busy} className="btn-primary flex-1">Войти</button>
          <button onClick={() => submit('up')} disabled={busy} className="btn-secondary flex-1">Регистрация</button>
        </div>
        {msg && <p className="text-sm text-ink-soft">{msg}</p>}
      </div>
    </section>
  )
}
