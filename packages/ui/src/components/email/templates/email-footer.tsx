import { Text, Section } from '@react-email/components'
import { footer, footerText } from '../styles/email.js'

interface EmailFooterProps {
  companyName: string
}

const EmailFooter = ({ companyName }: EmailFooterProps) => {
  return (
    <Section style={footer}>
      <Text style={footerText}>
        {/* {companyName}, 123 Business St, City, State 12345 */}
      </Text>
      <Text style={footerText}>© 2025 {companyName}. All rights reserved.</Text>
    </Section>
  )
}

export default EmailFooter
