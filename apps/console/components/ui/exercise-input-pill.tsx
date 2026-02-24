import { ChangeEventHandler, MouseEventHandler } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus } from 'lucide-react'

interface ExerciseInputPillProps extends React.ComponentProps<'input'> {
  onSetValue: (target: { name: string; value: string; id: string }) => void
}

const ExerciseInputPill = ({
  onSetValue,
  ...props
}: ExerciseInputPillProps) => {
  const { name, id, value: initialValue } = props

  if (!name || !id) throw new Error('missing props')

  const handleSelection: MouseEventHandler<HTMLInputElement> = (e) => {
    const target = e.currentTarget
    const { value } = target

    target.setSelectionRange(0, value.length)
  }

  const handleIncrement = () => {
    const newValue =
      typeof initialValue === 'string'
        ? parseInt(initialValue) + 1
        : typeof initialValue === 'number'
          ? initialValue + 1
          : 0

    if (newValue <= 99) {
      return onSetValue({ name, value: newValue.toString(), id })
    }
  }

  const handleDecrement = () => {
    const newValue =
      typeof initialValue === 'string'
        ? parseInt(initialValue) - 1
        : typeof initialValue === 'number'
          ? initialValue - 1
          : 0

    if (newValue >= Number(props.min ?? 0)) {
      return onSetValue({ name, value: newValue.toString(), id })
    }
  }

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const min = String(props.min)
    const value = e.target.value

    let input: string

    if (value === '') input = min
    else if (value.startsWith('0') && value.slice(1) !== '')
      input = value.slice(1)
    else if (Number(value) < Number(min)) input = min
    else input = value

    const regex = /^(?:[1-9]?[0-9])?$/
    if (regex.test(input)) {
      onSetValue({ name, value: input, id })
    }
  }
  return (
    <div className='flex max-w-[108px]'>
      <Button
        type='button'
        size='icon'
        variant='outline'
        onClick={handleDecrement}
        className='rounded-tr-none rounded-br-none border-r-0'
      >
        <Minus />
      </Button>
      <Input
        type='text'
        value={initialValue}
        onChange={handleChange}
        onClick={handleSelection}
        className='focus-visible:border-ring focus-visible:ring-ring/50 min-w-8 rounded-none p-2 text-center focus-visible:ring-inset dark:border-t-zinc-700 dark:border-b-zinc-700'
        {...props}
      />
      <Button
        type='button'
        size='icon'
        variant='outline'
        onClick={handleIncrement}
        className='rounded-tl-none rounded-bl-none border-l-0'
      >
        <Plus />
      </Button>
    </div>
  )
}

export default ExerciseInputPill
