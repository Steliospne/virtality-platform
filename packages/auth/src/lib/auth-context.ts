import { auth } from '../auth.ts'

export type AuthContext = {
  user: typeof auth.$Infer.Session.user | null
  session: typeof auth.$Infer.Session.session | null
}
