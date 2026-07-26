'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePartnerLogos } from '@/lib/marketing-queries'
import PrototypeVariantSwitcher from '@/components/shared/prototype-variant-switcher'
import CredibilitySectionHeader from './credibility-section-header'
import ClinicalPartners from './clinical-partners'
import PressLogos from './press-logos'
import StrategicPartners from './strategic-partners'
import { mapPartnerLogosToCredibilityLists } from '../lib/partner-logo-adapter'
import { PRESS_LOGO_ITEMS, SUPPORTED_BY_CONTENT } from '../content'
import {
  getVisiblePartnerRows,
  hasPartnerSection,
  hasPressSection,
} from '../lib/partner-press'
import {
  logoToneForVariant,
  SUPPORTED_BY_LOGO_STYLE_VARIANTS,
} from '../prototype/logo-style-variants'

// PROTOTYPE — two full-opacity logo treatments on the home Supported by
// section, switchable via `?variant=A|B`.

function SupportedByInner() {
  const searchParams = useSearchParams()
  const isPrototype = process.env.NODE_ENV !== 'production'
  const logoTone = isPrototype
    ? logoToneForVariant(searchParams.get('variant'))
    : undefined

  const { data: partnerLogos = [] } = usePartnerLogos()
  const { strategicLogos, clinicalLogos } =
    mapPartnerLogosToCredibilityLists(partnerLogos)
  const partnerRows = getVisiblePartnerRows(strategicLogos, clinicalLogos)
  const hasPartners = hasPartnerSection(strategicLogos, clinicalLogos)
  const hasPress = hasPressSection(PRESS_LOGO_ITEMS)

  if (!hasPartners && !hasPress) {
    return null
  }

  const strategicRow = partnerRows.find((row) => row.kind === 'strategic')
  const clinicalRow = partnerRows.find((row) => row.kind === 'clinical')

  return (
    <>
      <section className='relative overflow-hidden bg-white py-20'>
        <div className='container m-auto px-4 md:px-8'>
          {hasPartners ? (
            <>
              <CredibilitySectionHeader content={SUPPORTED_BY_CONTENT} />

              {strategicRow ? (
                <StrategicPartners
                  logos={strategicRow.logos}
                  logoTone={logoTone}
                />
              ) : null}

              {clinicalRow ? (
                <ClinicalPartners
                  logos={clinicalRow.logos}
                  showLabel={Boolean(strategicRow)}
                  logoTone={logoTone}
                />
              ) : null}
            </>
          ) : null}

          <PressLogos className={hasPartners ? 'mt-20' : undefined} />
        </div>
      </section>

      {isPrototype ? (
        <PrototypeVariantSwitcher variants={SUPPORTED_BY_LOGO_STYLE_VARIANTS} />
      ) : null}
    </>
  )
}

const SupportedBy = () => {
  return (
    <Suspense fallback={null}>
      <SupportedByInner />
    </Suspense>
  )
}

export default SupportedBy
