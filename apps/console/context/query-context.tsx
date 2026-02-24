'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode } from 'react'
import { getQueryClient } from '@/integrations/tanstack-query/provider'

interface QueryCtxProviderProps {
  children?: ReactNode
}

export default function QueryCtxProvider({ children }: QueryCtxProviderProps) {
  const { queryClient } = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
