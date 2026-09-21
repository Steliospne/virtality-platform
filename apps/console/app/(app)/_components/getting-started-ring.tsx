const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const GettingStartedRing = ({
  done,
  total,
}: {
  done: number
  total: number
}) => {
  const offset = CIRCUMFERENCE * (1 - done / total)

  return (
    <svg
      viewBox='0 0 96 96'
      className='size-16'
      role='img'
      aria-label={`${done} of ${total} steps done`}
    >
      <circle
        cx='48'
        cy='48'
        r={RADIUS}
        fill='none'
        strokeWidth='8'
        className='stroke-muted'
      />
      <circle
        cx='48'
        cy='48'
        r={RADIUS}
        fill='none'
        strokeWidth='8'
        strokeLinecap='round'
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform='rotate(-90 48 48)'
        className='stroke-vital-blue-700 dark:stroke-vital-blue-400'
      />
      <text
        x='48'
        y='53'
        textAnchor='middle'
        fontSize='18'
        fontWeight='600'
        className='fill-foreground'
      >
        {done}/{total}
      </text>
    </svg>
  )
}

export default GettingStartedRing
