import { Column, Heading, Img, Row, Section } from '@react-email/components'
import { header, headerText } from '../styles/email.ts'

const baseURL = process.env.CDN_URL

if (!baseURL) {
  throw new Error('CDN_URL environment variable is required')
}

const EmailHeader = () => {
  return (
    <Section style={header}>
      <Row>
        <Column style={{ width: '50px' }}>
          <Img
            src={`${baseURL}/small_logo_400x400.png`}
            alt='logo'
            width='50'
            height='50'
          />
        </Column>
        <Column align='left'>
          <Heading style={{ ...headerText, marginLeft: '16px' }}>
            Virtality
          </Heading>
        </Column>
      </Row>
    </Section>
  )
}

export default EmailHeader
