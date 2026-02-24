import EmailBase from './templates/email-base.tsx'
import EmailHeader from './templates/email-header.tsx'
import EmailFooter from './templates/email-footer.tsx'
import { card, container, paragraph } from './styles/email.ts'
import { Container, Section, Text, Img, Heading } from '@react-email/components'

interface MeetVirtalityProps {
  companyName?: string
}

const baseURL = process.env.CDN_URL

if (!baseURL) {
  throw new Error('CDN_URL environment variable is required')
}

export const MeetVirtality = ({
  companyName = 'Virtality',
}: MeetVirtalityProps) => (
  <EmailBase preview='See how Virtality speeds recovery with custom VR programs'>
    <Container className='container' style={container}>
      {/* Header */}
      <EmailHeader />

      {/* Body Content */}
      <Section
        style={{
          background:
            'linear-gradient(315deg, #018B94 7%, #979999 37% 40%, #018B94 73%)',
        }}
      >
        <Img
          alt='Virtality banner, girl wearing a VR headset doing exercise.'
          src={`${baseURL}/email-promo-banner.jpg`}
          width={480}
          style={{ margin: 'auto' }}
        />
      </Section>

      <Section
        style={{
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingTop: '40px',
          paddingBottom: '40px',
        }}
      >
        <Heading
          className='heading-main'
          style={{
            fontSize: '32px',
            fontWeight: '700',
            lineHeight: '1.3',
            color: '#2d3748',
            marginBottom: '24px',
            marginTop: '0',
          }}
        >
          Virtality: VR-Powered Physiotherapy
        </Heading>

        <Section style={card}>
          <Heading
            style={{
              fontSize: '18px',
              fontWeight: '700',
              marginTop: '0',
              marginBottom: '16px',
            }}
          >
            What Virtality can do:
          </Heading>

          <Text style={{ ...paragraph, marginBottom: '12px', marginTop: '0' }}>
            • <strong>Personalized therapy programs:</strong> Create fully
            customized VR rehabilitation programs in minutes through our web app
            (patients get clear, interactive guidance without constant
            supervision)
          </Text>

          <Text style={{ ...paragraph, marginBottom: '12px', marginTop: '0' }}>
            • <strong>Reduce pain and anxiety:</strong> VR experiences decrease
            pain, fear, and anxiety while boosting engagement and activating
            neuroplasticity for faster recovery
          </Text>

          <Text style={{ ...paragraph, marginBottom: '0', marginTop: '0' }}>
            • <strong>Real-time monitoring:</strong> Track patient progress
            through a simple dashboard, adjust therapy on the fly, and supervise
            multiple patients simultaneously (automate repetitive tasks and
            boost clinic revenue)
          </Text>
        </Section>

        <Text style={paragraph}>
          That patient assessment you've been avoiding? Set up in 90 seconds.
          <br />
          Wondering why recovery suddenly plateaued? Get the answer before next
          session.
        </Text>

        <Text style={paragraph}>
          Treat more patients, document better outcomes (or just finish your
          shift on time and take the rest of the week off).
        </Text>

        <Section style={{ marginTop: '32px', textAlign: 'center' }}>
          <a
            href='https://www.youtube.com/watch?v=rZtT4pAWddk'
            style={{ display: 'block', textDecoration: 'none' }}
          >
            <div
              style={{
                backgroundColor: '#f7f7f7',
                padding: '40px',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
              }}
            >
              <Img
                alt='Virtality demo video thumbnail - Click to watch on YouTube'
                src={`${baseURL}/email-video-thumbnail.png`}
                width={420}
                style={{ margin: 'auto', borderRadius: '8px' }}
              />
              <Text
                style={{
                  fontSize: '16px',
                  color: '#2d3748',
                  margin: '0',
                  fontWeight: '600',
                }}
              >
                Watch Demo Video
              </Text>
            </div>
          </a>
          <Text
            style={{
              fontSize: '14px',
              color: '#718096',
              marginTop: '12px',
              marginBottom: '0',
            }}
          >
            Click the image above to watch our demo video on YouTube
          </Text>
        </Section>
      </Section>
      {/* Footer */}
      <EmailFooter companyName={companyName} />
    </Container>
  </EmailBase>
)

export default MeetVirtality
