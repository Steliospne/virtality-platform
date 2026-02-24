import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const FilterBadge = ({
  name,
  checked: checkedProp,
  onClick,
}: {
  name: string;
  checked?: boolean;
  onClick?: () => void;
}) => {
  const [checked, setChecked] = useState(checkedProp || false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    setChecked(!checked);
  };

  return (
    <div>
      <Badge
        className={cn(
          'cursor-pointer rounded-full px-2 py-1',
          checked ? 'bg-foreground' : '',
        )}
        onClick={handleClick}
      >
        {name}
      </Badge>
    </div>
  );
};

export default FilterBadge;
