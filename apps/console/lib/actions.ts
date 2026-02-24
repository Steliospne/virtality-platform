'use server'
import { OrganizationSchema, UserSchema } from './definitions'
import {
  BugReportForm,
  IMAGE_TYPE,
  ImageType,
  Organization,
} from '@/types/models'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { User } from '@/auth-client'
import { cookies } from 'next/headers'
import { prisma } from '@virtality/db'
import { BugReport, BugReportImage } from '@virtality/db'
import { getUser, getUserAndSession } from './authActions'
import { getUUID, randomImageName } from './utils'
import { uploadFile } from '@/S3'

// GENERAL ACTIONS
export const getCookie = async (key: string) => {
  const cookieStore = await cookies()
  return cookieStore.get(key)
}

export const setCookie = async (key: string, value: string) => {
  const cookieStore = await cookies()

  cookieStore.set(key, value)
  console.log(key, value)
}

// BUG REPORT ACTIONS
export const createBugReport = async (
  values: BugReportForm & { image: File[] },
) => {
  console.log(values)

  const { title, description, platform, image } = values

  const newBugReport: BugReport = {
    id: getUUID(),
    title,
    description,
    platform,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }

  try {
    await prisma.bugReport.create({ data: newBugReport })
    await notifyDiscord(newBugReport)
  } catch (error) {
    console.log('Error creating BugReport: ', error)
  }

  const bugReportImages: BugReportImage[] = []

  if (Array.isArray(image)) {
    // Convert each File into a Buffer asynchronously
    const mappedImages = await Promise.all(
      image
        .filter((imgFile): imgFile is File => imgFile instanceof File)
        .map(async (imageFile) => {
          const type = imageFile.type as ImageType
          return {
            contentType: imageFile.type,
            type: IMAGE_TYPE[type],
            buffer: Buffer.from(await imageFile.arrayBuffer()),
          }
        }),
    )

    // Now upload each buffer and create the URLs
    for (const mappedImage of mappedImages) {
      const generatedURL = randomImageName() + '_BugReport' + mappedImage.type

      await uploadFile({
        ContentType: mappedImage.contentType,
        Body: mappedImage.buffer,
        Key: generatedURL,
      })

      bugReportImages.push({
        id: getUUID(),
        bugReportId: newBugReport.id,
        image: generatedURL,
      })
    }
  }

  await prisma.bugReportImage.createMany({ data: bugReportImages })
}

export const notifyDiscord = async (bugReport: BugReport) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    console.error('Missing Discord webhook URL')
    return
  }

  const message = {
    username: 'Bug Reporter 🐞',
    embeds: [
      {
        title: `🐛 New Bug Report`,
        color: 0xff0000, // red
        fields: [
          {
            name: 'Title',
            value: bugReport.title ?? 'No title',
            inline: false,
          },
          {
            name: 'Description',
            value: bugReport.description ?? 'No description',
            inline: false,
          },
          { name: 'Platform', value: bugReport.platform, inline: false },
          // { name: "Reported By", value: bugReport.userId?.toString() ?? "Anonymous", inline: true },
          {
            name: 'Created At',
            value: new Date(bugReport.createdAt).toLocaleString(),
            inline: true,
          },
        ],
      },
    ],
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
  } catch (err) {
    console.error('Failed to send Discord webhook:', err)
  }
}

// USER ACTIONS

export const updateUserAction = async (
  state: { data: User | null } | undefined,
  formData?: FormData,
) => {
  if (!formData) return state
  const oldUser = await getUser()
  const updatedUser = Object.fromEntries(formData) as unknown as User

  const newUser = {
    ...oldUser,
    ...updatedUser,
  }

  const validatedData = UserSchema.safeParse(newUser)
  // TODO make the update action more efficient by only updating the field changed
  // instead of rewriting the user
  if (!validatedData.success)
    return {
      data: updatedUser,
    }

  if (validatedData.success) {
    await prisma.user.update({
      where: { id: validatedData.data.id },
      data: validatedData.data,
    })
    return { data: newUser }
  }
}

// ORGANIZATION ACTIONS
export const createOrganizationAction = async (
  state:
    | {
        data: Pick<Organization, 'name' | 'slug'> | null
      }
    | undefined,
  formData?: FormData,
) => {
  if (!formData) return state

  const { name, slug } = Object.fromEntries(formData) as Pick<
    Organization,
    'name' | 'slug'
  >

  const organizationFields = { name, slug, logo: null, createdAt: new Date() }

  const validatedData = OrganizationSchema.safeParse(organizationFields)

  if (!validatedData.success)
    return {
      data: { name, slug },
    }

  // let redirectId = '';

  if (validatedData.success) {
    try {
      // const data = await auth.api.createOrganization({
      //   headers: await headers(),
      //   body: {
      //     name: validatedData.data.name,
      //     slug: validatedData.data.slug,
      //   },
      // });
      // if (data?.id) redirectId = data.id;
      // return success state
    } catch (error) {
      console.log(error)
      return {
        data: null,
      }
    }
    // redirect(`/organization/${redirectId}`);
  }
}

export const updateOrganizationAction = async (formData: FormData) => {
  if (!formData) return

  const entries = Object.fromEntries(formData) as unknown as Pick<
    Organization,
    'id' | 'name'
  > & { isFrozen: string }
  const { id, name, isFrozen } = entries
  const oldOrg = await prisma.organization.findFirst({
    where: { id },
  })

  const newOrg = {
    ...oldOrg,
    name,
    isFrozen: isFrozen === 'true' ? false : true,
  }

  await prisma.organization.update({
    where: { id },
    data: newOrg,
  })

  revalidatePath('/organization/[id]/page.tsx', 'page')
}

export const deleteOrganizationAction = async (formData: FormData) => {
  const entries = Object.fromEntries(formData) as {
    organizationId: string
    userId: string
  }

  if (!entries.organizationId || !entries.userId) return

  const organization = await prisma.organization.findFirst({
    where: { id: entries.organizationId },
  })

  if (!organization) throw new Error('Organization not found')

  if (organization.isFrozen) {
    await prisma.organization.delete({
      where: { id: entries.organizationId },
    })
    redirect(`/user/${entries.userId}/organizations/`)
  } else {
    throw new Error('Cannot delete an active organization')
  }
}

export const createInvitationAction = async (
  state: {
    success: boolean
    message: string
  },
  formData: FormData,
) => {
  const session = await getUserAndSession()

  if (!formData || !session) return state

  const entries = Object.fromEntries(formData) as {
    email: string
    role: 'member' | 'admin' | 'owner'
    organizationId: string
  }

  const { organizationId, email } = entries

  const self = session.user.email === email
  if (self) return { success: false, message: 'You cannot invite your self.' }

  const existingInvitation = await prisma.invitation.findFirst({
    where: { organizationId, AND: [{ email }] },
  })

  if (existingInvitation)
    return { success: false, message: 'Pending invitation already exists' }

  // await auth.api.createInvitation({
  //   headers: await headers(),
  //   body: {
  //     email,
  //     role,
  //     organizationId,
  //   },
  // });

  return { success: true, message: '' }
}
