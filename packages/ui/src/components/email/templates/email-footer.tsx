import type { ReactNode } from 'react'
import { Text, Section } from 'react-email'
import { footer, footerText } from '../styles/email.js'

interface EmailFooterProps {
  companyName: string
  /** Extra footer lines, e.g. the Admin-authored Email opt-out line. */
  children?: ReactNode
}

const EmailFooter = ({ companyName, children }: EmailFooterProps) => {
  return (
    <Section style={footer}>
      <Text style={footerText}>
        {/* {companyName}, 123 Business St, City, State 12345 */}
      </Text>
      {children}
      <Text style={footerText}>
        © {new Date().getFullYear()} {companyName}. All rights reserved.
      </Text>
    </Section>
  )
}

export default EmailFooter
