'use client'

import { usePartnerLogos } from '@/lib/marketing-queries'
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

const SupportedBy = () => {
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
    <section className='relative overflow-hidden bg-white py-20'>
      <div className='container m-auto px-4 md:px-8'>
        {hasPartners ? (
          <>
            <CredibilitySectionHeader content={SUPPORTED_BY_CONTENT} />

            {strategicRow ? (
              <StrategicPartners logos={strategicRow.logos} />
            ) : null}

            {clinicalRow ? (
              <ClinicalPartners
                logos={clinicalRow.logos}
                showLabel={Boolean(strategicRow)}
              />
            ) : null}
          </>
        ) : null}

        <PressLogos className={hasPartners ? 'mt-20' : undefined} />
      </div>
    </section>
  )
}

export default SupportedBy
