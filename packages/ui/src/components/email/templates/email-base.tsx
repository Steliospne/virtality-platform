import { Body, Html, Preview, Head } from '@react-email/components'
import { main } from '../styles/email.ts'

interface EmailBaseProps {
  children: React.ReactNode
  preview?: string
}

const EmailBase = ({ children, preview = '' }: EmailBaseProps) => {
  return (
    <Html>
      <Head>
        <style>{`
          @media only screen and (max-width: 600px) {
            .container {
              padding: 20px !important;
            }
            .heading-main {
              font-size: 24px !important;
            }
            .heading-section {
              font-size: 20px !important;
            }
            .card-section {
              padding: 24px !important;
            }
            .play-icon {
              font-size: 36px !important;
            }
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={main}>{children}</Body>
    </Html>
  )
}

export default EmailBase
