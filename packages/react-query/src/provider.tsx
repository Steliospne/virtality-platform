'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React, { type ReactNode } from 'react'
import { getQueryClient } from './get-query-client.js'

export { getQueryClient } from './get-query-client.js'

export interface QueryProviderProps {
  children?: ReactNode
  devtools?: boolean
}

/**
 * Provider that wraps the app with QueryClientProvider and optionally ReactQueryDevtools.
 * Uses getQueryClient() when client is not passed.
 */
export function QueryProvider({
  children,
  devtools = process.env.NODE_ENV === 'development',
}: QueryProviderProps): React.ReactElement {
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {devtools && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}
