const SmallLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      <g clipPath='url(#clip0_4_2)'>
        <g clipPath='url(#clip1_4_2)'>
          <rect width='16' height='16' rx='2' fill='#08899A' />
          <path
            d='M8.23984 9.14543L10.7075 5.1H12.25L8.99401 10.345L8.23984 9.14543ZM8.71951 10.6877C8.6851 10.7565 8.61738 10.7906 8.58297 10.8249C8.44534 10.9277 8.23984 10.9622 7.99993 10.9622C7.72573 10.9622 7.5546 10.9277 7.41697 10.8249C7.28032 10.7221 7.14357 10.585 7.04049 10.4134L3.75 5.1H5.29247L7.45149 8.59673V8.63113L7.99993 9.52259L8.71951 10.6877Z'
            fill='white'
          />
          <circle cx='8' cy='8' r='6.6' stroke='white' strokeWidth='0.3' />
        </g>
      </g>
      <defs>
        <clipPath id='clip0_4_2'>
          <rect width='16' height='16' fill='white' />
        </clipPath>
        <clipPath id='clip1_4_2'>
          <rect width='16' height='16' fill='white' />
        </clipPath>
      </defs>
    </svg>
  )
}

export default SmallLogo
