import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

test('на главной видна нижняя навигация', () => {
  render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
  expect(screen.getByText('Рецепты')).toBeInTheDocument()
  expect(screen.getByText('Покупки')).toBeInTheDocument()
  expect(screen.getByText('Добавить')).toBeInTheDocument()
  expect(screen.getByText('Настройки')).toBeInTheDocument()
})
