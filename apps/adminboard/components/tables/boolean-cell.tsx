type BooleanCellProps = {
  value: boolean
  trueLabel?: string
  falseLabel?: string
}

/** ✅ / ❌ for boolean table values, with a readable label for screen readers. */
export const BooleanCell = ({
  value,
  trueLabel = 'Yes',
  falseLabel = 'No',
}: BooleanCellProps) => (
  <span role='img' aria-label={value ? trueLabel : falseLabel}>
    {value ? '✅' : '❌'}
  </span>
)
