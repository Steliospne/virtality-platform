import { ChangeEventHandler, MouseEventHandler, useEffect } from 'react'
import { Input } from './input'

interface ExerciseInputProps extends React.ComponentProps<'input'> {
  onSetValue: (target: { name: string; value: string; id: string }) => void
}
const ExerciseInput = ({ onSetValue, ...props }: ExerciseInputProps) => {
  const step = Number(props.step) || 1
  const { name, id } = props

  useEffect(() => {
    if (!name || !id) return

    const handleWheel = (event: WheelEvent) => {
      const target = document.getElementById(id) as HTMLInputElement | null
      if (!target || document.activeElement !== target) return

      event.preventDefault()

      const currentValue = Number(target.value || props.min || 0)
      const delta = event.deltaY < 0 ? step : -step
      const nextValue = Math.max(Number(props.min ?? 0), currentValue + delta)

      onSetValue({ name, value: String(nextValue), id })
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [id, name, onSetValue, props.min, step])

  const handleSelection: MouseEventHandler<HTMLInputElement> = (e) => {
    const target = e.currentTarget
    const { value } = target
    target.setSelectionRange(0, value.length)
  }

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!name || !id) return
    const min = String(props.min)
    const max = String(props.max)
    const value = e.target.value

    if (Number.isNaN(Number(value))) return

    let input: string
    if (value === '' || !value) input = min ?? 0
    else if (value.startsWith('0') && value.slice(1) !== '')
      input = value.slice(1)
    else if (Number(value) < Number(min) && min) input = min
    else if (Number(value) > Number(max) && max) input = max
    else input = value

    onSetValue({ name, value: input, id })
  }

  return <Input {...props} onClick={handleSelection} onChange={handleChange} />
}

export default ExerciseInput
