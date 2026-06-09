import { QueryProvider, ORPCProvider } from '@virtality/react-query'
import { ThemeProvider } from 'next-themes'
import TinyBaseProvider from '@/context/tinybase-context'
import TourProvider from '@/context/tour-context'
import SocketWarmUp from '@/components/auth/socket-warm-up'
import CookieBanner from '@/components/layout/cookie-banner'
import { ToastContainer } from 'react-toastify'
import { ORPC_PREFIX, getServerUrl } from '@virtality/shared/types'
const baseURL = getServerUrl()

async function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ORPCProvider url={baseURL + ORPC_PREFIX} credentials='include'>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <TinyBaseProvider>
            <TourProvider>
              <div id='root'>
                <SocketWarmUp />
                {children}
                <ToastContainer
                  position='bottom-right'
                  autoClose={5000}
                  hideProgressBar
                  newestOnTop
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss={false}
                  draggable
                  pauseOnHover={false}
                  theme='dark'
                />
                <CookieBanner />
              </div>
            </TourProvider>
          </TinyBaseProvider>
        </ThemeProvider>
      </ORPCProvider>
    </QueryProvider>
  )
}

export default RootProvider
