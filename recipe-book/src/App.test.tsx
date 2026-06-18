import { render, screen } from '@testing-library/react'
import App from './App'

test('рендерит заголовок приложения', () => {
  render(<App />)
  expect(screen.getByText('Кулинарная книга')).toBeInTheDocument()
})
