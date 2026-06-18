import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StarRating from './StarRating'

test('показывает оценку и вызывает onChange по клику', async () => {
  const onChange = vi.fn()
  render(<StarRating value={3} onChange={onChange} />)
  const stars = screen.getAllByRole('button')
  expect(stars).toHaveLength(5)
  await userEvent.click(stars[4])
  expect(onChange).toHaveBeenCalledWith(5)
})
