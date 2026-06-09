const API_VERSION = 'v1'

export const API_PREFIX = `/api/${API_VERSION}`
export const ORPC_PREFIX = `${API_PREFIX}/rpc`

// Production URLs
export const CONSOLE_URL = 'https://console.virtality.app'
export const ADMINBOARD_URL = 'https://admin.virtality.app'
export const WEBSITE_URL = 'https://virtality.app'
export const SERVER_URL = 'https://service.virtality.app'
export const CDN_URL = 'https://cdn.virtality.app'
export const SOCKET_URL = 'https://socket.virtality.app'

// Staging URLs
export const CONSOLE_URL_STAGING = 'https://preview-console.virtality.app'
export const ADMINBOARD_URL_STAGING = 'https://preview-admin.virtality.app'
export const WEBSITE_URL_STAGING = 'https://preview-web.virtality.app'
export const SERVER_URL_STAGING = 'https://preview-service.virtality.app'
export const SOCKET_URL_STAGING = 'https://preview-socket.virtality.app'

// Local URLs
export const CONSOLE_URL_LOCAL = 'http://localhost:3001'
export const ADMINBOARD_URL_LOCAL = 'http://localhost:3002'
export const WEBSITE_URL_LOCAL = 'http://localhost:3000'
export const SERVER_URL_LOCAL = 'http://localhost:8080'
export const SOCKET_URL_LOCAL = 'http://localhost:8081'

export const getServerUrl = () => {
  const env = process.env.NEXT_PUBLIC_ENV || 'development'
  return env === 'production'
    ? SERVER_URL
    : env === 'preview'
      ? SERVER_URL_STAGING
      : SERVER_URL_LOCAL
}

export const getSocketUrl = () => {
  const env = process.env.NEXT_PUBLIC_ENV || 'development'
  return env === 'production'
    ? SOCKET_URL
    : env === 'preview'
      ? SOCKET_URL_STAGING
      : SOCKET_URL_LOCAL
}

export const getConsoleUrl = () => {
  const env = process.env.NEXT_PUBLIC_ENV || 'development'
  return env === 'production'
    ? CONSOLE_URL
    : env === 'preview'
      ? CONSOLE_URL_STAGING
      : CONSOLE_URL_LOCAL
}

export const getAdminUrl = () => {
  const env = process.env.NEXT_PUBLIC_ENV || 'development'
  return env === 'production'
    ? ADMINBOARD_URL
    : env === 'preview'
      ? ADMINBOARD_URL_STAGING
      : ADMINBOARD_URL_LOCAL
}

export const getWebsiteUrl = () => {
  const env = process.env.NEXT_PUBLIC_ENV || 'development'
  return env === 'production'
    ? WEBSITE_URL
    : env === 'preview'
      ? WEBSITE_URL_STAGING
      : WEBSITE_URL_LOCAL
}
