'use client'
import { createStore } from 'tinybase'
import { Provider, useCreatePersister, useCreateStore } from 'tinybase/ui-react'
import { createLocalPersister } from 'tinybase/persisters/persister-browser'
import { UserLocalData } from '@/types/models'
import { authClient } from '@/auth-client'

const TinyBaseProvider = ({ children }: { children: React.ReactNode }) => {
  const { data } = authClient.useSession()
  const user = data?.user
  const store = useCreateStore(createStore)

  useCreatePersister(
    store,
    (store) => createLocalPersister(store, 'localData'),
    [],
    async (persister) => {
      await persister.startAutoLoad()
      // Ensure 'users' table exists and has at least one default row
      const usersTable = store.getTable('users')
      const users = Object.keys(usersTable)
      const userExists = users.includes(user?.id ?? '')
      if (!user) return
      if (!userExists) {
        store.setRow('users', user?.id ?? '', {
          newUser: true,
          device: false,
          patient: false,
          program: false,
          dashboardSuggestionSidebar: true,
          dashboardSuggestionDropdown: true,
        } as UserLocalData)
      }
      await persister.startAutoSave()
    },
    [user],
  )

  return <Provider store={store}>{children}</Provider>
}

export default TinyBaseProvider
