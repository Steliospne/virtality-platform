import { Input } from '@/components/ui/input'
import { memo, useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import en from 'react-phone-number-input/locale/en'
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumber,
  Country,
} from 'react-phone-number-input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Button } from './button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const countries = getCountries()

interface PhoneInputProps {
  value?: string
  onChange: (value?: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
}

const MemoPhoneInput = ({
  id,
  value,
  onChange,
  placeholder,
}: PhoneInputProps) => {
  const [country, setCountry] = useState<Country | undefined>(undefined)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!value) return
    try {
      const phoneNumber = parsePhoneNumber(value)
      if (phoneNumber?.country) setCountry(phoneNumber.country)
    } catch {}
  }, [value, country])

  const handleCountryChange = (newCountry: string) => {
    setOpen(!open)
    if (!newCountry) {
      setCountry(undefined)
      onChange(undefined)
      return
    }

    const selectedCountry = newCountry as Country
    setCountry(selectedCountry)

    // When country changes, clear the input but set country code in the value
    try {
      const countryCode = getCountryCallingCode(selectedCountry)
      onChange(`+${countryCode}`)
    } catch {
      // invalid country code - clear selection
      setCountry(undefined)
      onChange(undefined)
    }
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    if (!country) {
      onChange(inputValue)
      return
    }

    // Clean the input (remove any non-digit characters)
    const cleanedInput = inputValue.replace(/[^\d]/g, '')

    // Build the full phone number with country code for the backend
    const countryCode = getCountryCallingCode(country)
    const fullPhoneNumber = cleanedInput
      ? `+${countryCode}${cleanedInput}`
      : `+${countryCode}`

    onChange(fullPhoneNumber)
  }

  const CountryIcon = useMemo(() => {
    return !country ? (
      <InternationalIcon />
    ) : (
      <div className='flex w-max items-center gap-1'>
        <Image
          alt='Country flag'
          src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${country}.svg`}
          width={16}
          height={16}
          className='size-4'
        />
        <span>+{getCountryCallingCode(country)}</span>
      </div>
    )
  }, [country])

  const displayValue = useMemo(() => {
    if (!value) return ''
    if (!country) return value
    try {
      const phoneNumber = parsePhoneNumber(value)
      if (phoneNumber && phoneNumber.country === country) {
        // Return the national number without country code
        return phoneNumber.nationalNumber
      }

      // If parsing fails, try to extract the number part manually
      const countryCode = getCountryCallingCode(country)
      const withoutCountryCode = value.replace(`+${countryCode}`, '')
      return withoutCountryCode
    } catch {
      // Fallback: remove country code manually
      if (country) {
        const countryCode = getCountryCallingCode(country)
        return value.replace(`+${countryCode}`, '')
      }
      return value
    }
  }, [value, country])

  return (
    <div className='flex'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            className='w-fit rounded-tr-none rounded-br-none'
          >
            {CountryIcon}
          </Button>
        </PopoverTrigger>
        <PopoverContent align='start' className='p-0 dark:border-zinc-600'>
          <Command>
            <CommandInput placeholder='Search country...' className='h-9' />
            <CommandList>
              <CommandEmpty>Country not found.</CommandEmpty>
              <CommandGroup>
                {countries?.map((countryCode) => (
                  <CommandItem
                    key={countryCode}
                    value={countryCode}
                    keywords={[en[countryCode]]}
                    onSelect={handleCountryChange}
                  >
                    <div className='flex items-center gap-2'>
                      <Image
                        alt={`${countryCode} flag`}
                        src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode}.svg`}
                        width={16}
                        height={16}
                        className='size-4'
                        loading='eager'
                      />
                      <span>{`${en[countryCode]} +${getCountryCallingCode(countryCode)}`}</span>
                    </div>
                    <Check
                      className={cn(
                        'ml-auto',
                        country === countryCode ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        id={id}
        value={displayValue}
        onChange={handlePhoneNumberChange}
        placeholder={placeholder || 'Enter phone number'}
        maxLength={20}
        className='rounded-tl-none rounded-bl-none'
      />
    </div>
  )
}

const PhoneInput = memo(MemoPhoneInput)
export default PhoneInput

const InternationalIcon = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 75 50'
      className='size-4'
    >
      <title>InternationalIcon</title>
      <g
        className='PhoneInputInternationalIconGlobe'
        stroke='currentColor'
        fill='none'
        strokeWidth='2'
        strokeMiterlimit='10'
      >
        <path
          strokeLinecap='round'
          d='M47.2,36.1C48.1,36,49,36,50,36c7.4,0,14,1.7,18.5,4.3'
        />
        <path d='M68.6,9.6C64.2,12.3,57.5,14,50,14c-7.4,0-14-1.7-18.5-4.3' />
        <line x1='26' y1='25' x2='74' y2='25' />
        <line x1='50' y1='1' x2='50' y2='49' />
        <path
          strokeLinecap='round'
          d='M46.3,48.7c1.2,0.2,2.5,0.3,3.7,0.3c13.3,0,24-10.7,24-24S63.3,1,50,1S26,11.7,26,25c0,2,0.3,3.9,0.7,5.8'
        />
        <path
          strokeLinecap='round'
          d='M46.8,48.2c1,0.6,2.1,0.8,3.2,0.8c6.6,0,12-10.7,12-24S56.6,1,50,1S38,11.7,38,25c0,1.4,0.1,2.7,0.2,4c0,0.1,0,0.2,0,0.2'
        />
      </g>
      <path
        className='PhoneInputInternationalIconPhone'
        stroke='none'
        fill='currentColor'
        d='M12.4,17.9c2.9-2.9,5.4-4.8,0.3-11.2S4.1,5.2,1.3,8.1C-2,11.4,1.1,23.5,13.1,35.6s24.3,15.2,27.5,11.9c2.8-2.8,7.8-6.3,1.4-11.5s-8.3-2.6-11.2,0.3c-2,2-7.2-2.2-11.7-6.7S10.4,19.9,12.4,17.9z'
      />
    </svg>
  )
}
