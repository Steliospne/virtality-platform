/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
} from '@react-email/components'

interface InviteEmail {
  username?: string
  invitedByUsername?: string
  invitedByEmail?: string
  orgName?: string
  orgImage?: string
  inviteLink?: string
}

export default function InviteEmail({
  username,
  invitedByUsername,
  invitedByEmail,
  orgName,
  orgImage,
  inviteLink,
}: InviteEmail) {
  return (
    <Html>
      <Head />
      <Preview>{`You are invited to join ${orgName}!`}</Preview>
      <Body style={styles.body}>
        <Container>
          <Section style={styles.section}>
            <Text
              style={styles.heading}
            >{`You're Invited to ${orgName}!`}</Text>
            <Text>Hello,</Text>
            <Text>
              {invitedByUsername} has invited you to join{' '}
              <strong>{orgName}</strong> on our platform.
            </Text>
            <Text>
              Click the button below to accept the invitation and get started.
            </Text>
            <Button style={styles.button} href={inviteLink}>
              Accept Invitation
            </Button>
            <Text>
              If the button doesn’t work, copy and paste the following link into
              your browser:
            </Text>
            <Link href={inviteLink} style={styles.link}>
              {inviteLink}
            </Link>
            <Text>Looking forward to having you on board!</Text>
            <Text>
              Best regards, <br />
              The {orgName} Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: {
    backgroundColor: '#f4f4f4',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center' as const,
  },
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  button: {
    backgroundColor: '#007bff',
    color: '#ffffff',
    padding: '12px 24px',
    fontSize: '16px',
    borderRadius: '5px',
    textDecoration: 'none',
    display: 'inline-block',
    margin: '20px 0',
  },
  link: {
    color: '#007bff',
    wordBreak: 'break-all' as const,
  },
}
