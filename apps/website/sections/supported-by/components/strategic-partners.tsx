import CredibilityLogo from './credibility-logo'
import PartnerRowLabel from '@/components/shared/partner-row-label'
import { SUPPORTED_BY_CONTENT } from '../content'
import type { CredibilityLogoItem } from '../content'

type StrategicPartnersProps = {
  logos: readonly CredibilityLogoItem[]
}

const StrategicPartners = ({ logos }: StrategicPartnersProps) => {
  if (logos.length === 0) {
    return null
  }

  return (
    <>
      <PartnerRowLabel label={SUPPORTED_BY_CONTENT.strategicPartnersLabel} />
      <div className='mb-8 flex flex-col items-center justify-center gap-10 sm:flex-row'>
        {logos.map((logo) => (
          <CredibilityLogo key={logo.alt} item={logo} size='primary' />
        ))}
      </div>
    </>
  )
}

export default StrategicPartners
