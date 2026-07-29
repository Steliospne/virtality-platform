type PartnerRowLabelProps = {
  label: string
  size?: 'default' | 'large'
}

function PartnerRowLabel({ label, size = 'default' }: PartnerRowLabelProps) {
  return (
    <div className='my-8 flex items-center justify-center gap-6'>
      <div className='h-px max-w-32 flex-1 bg-linear-to-r from-transparent to-slate-200' />
      <span
        className={`${size === 'large' ? 'text-[10px]' : 'text-[9px]'} font-bold tracking-[0.35em] text-slate-400 uppercase`}
      >
        {label}
      </span>
      <div className='h-px max-w-32 flex-1 bg-linear-to-l from-transparent to-slate-200' />
    </div>
  )
}

export default PartnerRowLabel
