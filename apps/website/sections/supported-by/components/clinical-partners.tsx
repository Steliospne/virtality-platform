import CredibilityLogo from './credibility-logo'
import PartnerRowLabel from '@/components/shared/partner-row-label'
import { SUPPORTED_BY_CONTENT } from '../content'
import type { CredibilityLogoItem } from '../content'
import type { SupportedByLogoTone } from '../prototype/logo-style-variants'

type ClinicalPartnersProps = {
  logos: readonly CredibilityLogoItem[]
  showLabel?: boolean
  /** PROTOTYPE — full-opacity logo colour treatments */
  logoTone?: SupportedByLogoTone
}

const ClinicalPartners = ({
  logos,
  showLabel = true,
  logoTone,
}: ClinicalPartnersProps) => {
  if (logos.length === 0) {
    return null
  }

  return (
    <>
      {showLabel ? (
        <PartnerRowLabel label={SUPPORTED_BY_CONTENT.clinicalPartnersLabel} />
      ) : null}
      <div className='flex flex-wrap items-center justify-center gap-x-8 gap-y-6 sm:gap-10'>
        {logos.map((logo) => (
          <CredibilityLogo
            key={logo.alt}
            item={logo}
            size='secondary'
            tone={logoTone}
          />
        ))}
      </div>
    </>
  )
}

export default ClinicalPartners
