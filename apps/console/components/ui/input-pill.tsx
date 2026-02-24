import { ChangeEventHandler, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus } from 'lucide-react'

const InputPill = () => {
  const [value, setValue] = useState('')

  const handleIncrement = () => {
    const newValue = parseInt(value) + 1
    if (newValue <= 99) {
      setValue(newValue.toString())
    }
  }

  const handleDecrement = () => {
    const newValue = parseInt(value) - 1
    if (newValue >= 0) {
      setValue(newValue.toString())
    }
  }

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const input = e.target.value
    const regex = /^(?:[1-9]?[0-9])?$/
    if (regex.test(input)) {
      setValue(input)
    }
  }
  return (
    <div className='flex max-w-[108px]'>
      <Button
        size='icon'
        variant='outline'
        onClick={handleDecrement}
        className='rounded-tr-none rounded-br-none border-r-0'
      >
        <Minus />
      </Button>
      <Input
        type='text'
        value={value}
        onChange={handleChange}
        className='focus-visible:border-ring focus-visible:ring-ring/50 rounded-none p-2 text-center focus-visible:ring-inset'
      />
      <Button
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

export default InputPill
