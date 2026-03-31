import EmailBase from './templates/email-base.js'
import EmailHeader from './templates/email-header.js'
import EmailFooter from './templates/email-footer.js'
import {
  card,
  container,
  paragraph,
  sectionHeading,
  listItem,
} from './styles/email.js'
import { Container, Section, Text, Heading } from '@react-email/components'

interface ProductUpdateV0109Props {
  companyName?: string
}

export const ProductUpdateV0109 = ({
  companyName = 'Virtality',
}: ProductUpdateV0109Props) => (
  <EmailBase preview='Patch v0.1.09: 36 new exercises, favorites, filters, and major performance gains'>
    <Container className='container' style={container}>
      <EmailHeader />

      <Section
        style={{
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingTop: '32px',
          paddingBottom: '24px',
        }}
      >
        <Heading
          className='heading-main'
          style={{
            fontSize: '28px',
            fontWeight: '700',
            lineHeight: '1.3',
            color: '#2d3748',
            marginBottom: '8px',
            marginTop: '0',
          }}
        >
          Product Update - Patch v0.1.09
        </Heading>

        <Text style={{ ...paragraph, marginBottom: '24px', marginTop: '0' }}>
          We just shipped <strong>Patch v0.1.09</strong>. Here is what is new.
        </Text>

        <Heading style={sectionHeading}>New Additions</Heading>
        <Section style={card}>
          <Text style={listItem}>
            - Added <strong>19 new exercises</strong> with Thera Bands.
          </Text>
          <Text style={listItem}>
            - Added <strong>17 new exercises</strong> for the Wrist.
          </Text>
        </Section>

        <Heading style={sectionHeading}>New Platform Features</Heading>
        <Section style={card}>
          <Text style={listItem}>
            - Added <strong>favorites</strong> so you can always find the
            exercise you like.
          </Text>
          <Text style={listItem}>
            - Added <strong>filters</strong> to help with searching.
          </Text>
        </Section>

        <Heading style={sectionHeading}>Fixes</Heading>
        <Section style={card}>
          <Text style={listItem}>
            - Major optimizations with <strong>2x performance gains</strong>.
          </Text>
          <Text style={listItem}>
            - Reduced app size, which means <strong>faster downloads</strong>.
          </Text>
        </Section>

        <Text style={{ ...paragraph, marginTop: '28px', marginBottom: '0' }}>
          Thanks for building with us. We will keep shipping improvements to help
          your team move faster.
        </Text>
        <Text style={{ ...paragraph, marginTop: '8px', marginBottom: '0' }}>
          - The {companyName} team
        </Text>
      </Section>

      <EmailFooter companyName={companyName} />
    </Container>
  </EmailBase>
)

export default ProductUpdateV0109
