import { listUsers } from './list-users.ts'
import { isUserVerified } from './verify-user.ts'
import { findUsername } from './find-username.ts'
import { updateUserInfo } from './update-user-info.ts'
import { updateUserEmail } from './update-user-email.ts'
import hasPassword from './has-password.ts'

export const user = {
  isUserVerified,
  findUsername,
  hasPassword,
  list: listUsers,
  updateInfo: updateUserInfo,
  updateEmail: updateUserEmail,
}
