import { ChangeEventHandler, MouseEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';

const ExerciseInputPill = ({
  initialValue,
  onSetValue,
  step = 1,
  ...props
}: {
  initialValue: number | string;
  onSetValue: (target: { name: string; value: string; id: string }) => void;
} & React.ComponentProps<'input'>) => {
  const { name, id } = props;

  if (!name || !id) throw new Error('missing props');

  const handleSelection: MouseEventHandler<HTMLInputElement> = (e) => {
    const target = e.currentTarget;
    const { value } = target;
    target.setSelectionRange(0, value.length);
  };

  const handleIncrement = () => {
    const newValue =
      typeof initialValue === 'string' || typeof step === 'string'
        ? parseFloat(initialValue as string) + parseFloat(step as string)
        : initialValue + step;

    if (
      parseFloat(newValue.toFixed(1)) <= parseFloat((props.max as string) ?? 99)
    ) {
      return onSetValue({
        name,
        value: parseFloat(newValue.toFixed(1)).toString(),
        id,
      });
    }
  };

  const handleDecrement = () => {
    const newValue =
      typeof initialValue === 'string' || typeof step === 'string'
        ? parseFloat(initialValue as string) - parseFloat(step as string)
        : initialValue - step;

    if (parseFloat(newValue.toFixed(1)) >= 0) {
      return onSetValue({
        name,
        value: parseFloat(newValue.toFixed(1)).toString(),
        id,
      });
    }
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const input = e.target.value === '' ? '0' : e.target.value;
    const regex = /^(?:[1-9]?[0-9])?$/;
    if (regex.test(input)) {
      onSetValue({ name, value: input, id });
    }
  };
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
        className='focus-visible:border-ring focus-visible:ring-ring/50 min-w-9 rounded-none p-2 text-center focus-visible:ring-inset'
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
  );
};

export default ExerciseInputPill;
