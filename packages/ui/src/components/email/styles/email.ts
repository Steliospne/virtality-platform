export const main = {
  backgroundColor: '#f6f9fc',
}

export const text = {
  textAlign: 'left' as const,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

export const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '0',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  maxWidth: '600px',
}

export const header = {
  backgroundColor: '#06626e',
  padding: '40px 40px 30px',
  borderTopLeftRadius: '8px',
  borderTopRightRadius: '8px',
}

export const headerText = {
  ...text,
  margin: '0',
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '600',
  lineHeight: '1.3',
}

export const content = {
  padding: '40px',
}

export const paragraph = {
  ...text,
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  marginBottom: '16px',
}

export const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

export const button = {
  backgroundColor: '#08899a',
  color: '#ffffff',
  padding: '14px 32px',
  textDecoration: 'none',
  borderRadius: '6px',
  fontWeight: '600',
  fontSize: '16px',
  display: 'inline-block',
}

export const destructive = {
  ...button,
  backgroundColor: '#ff6467',
}

export const divider = {
  borderColor: '#E5E7EB',
  margin: '32px 0 24px',
}

export const smallText = {
  ...text,
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#6B7280',
  marginTop: '16px',
  textAlign: 'center' as const,
}

export const linkText = {
  ...text,
  textAlign: 'center' as const,
  fontSize: '13px',
  wordBreak: 'break-all' as const,
  backgroundColor: '#F3F4F6',
  padding: '12px',
  borderRadius: '4px',
  marginTop: '12px',
}

export const link = {
  color: '#4F46E5',
  textDecoration: 'none',
}

export const footer = {
  backgroundColor: '#F9FAFB',
  padding: '24px 40px',
  borderTop: '1px solid #E5E7EB',
  borderBottomLeftRadius: '8px',
  borderBottomRightRadius: '8px',
}

export const footerText = {
  ...text,
  textAlign: 'center' as const,
  fontSize: '13px',
  color: '#9CA3AF',
  margin: '4px 0',
  lineHeight: '1.5',
}

export const warningText = {
  ...text,
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '16px',
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid #dc2626',
  borderRadius: '4px',
  textAlign: 'center' as const,
}

export const card = {
  backgroundColor: '#f7f7f7',
  padding: '24px',
  borderRadius: '6px',
  marginBottom: '32px',
}
