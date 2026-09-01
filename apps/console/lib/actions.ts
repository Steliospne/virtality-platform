'use server'
import { UserSchema } from './definitions'
import { IMAGE_TYPE, ImageType } from '@/types/models'
import { BugReportForm } from '@/lib/definitions'
import { User } from '@/auth-client'
import { prisma } from '@virtality/db'
import { BugReport, BugReportImage } from '@virtality/db'
import { getUser } from './authActions'
import { getUUID, randomImageName } from './utils'
import { uploadFile } from '@/S3'
import { serverLogger } from './server-logger'

const logger = serverLogger.child({
  component: 'console-actions',
})

// GENERAL ACTIONS

// BUG REPORT ACTIONS
export const createBugReport = async (
  values: BugReportForm & { image: File[] },
) => {
  logger.info('console.bug_report.create.requested', {
    platform: values.platform,
    imageCount: Array.isArray(values.image) ? values.image.length : 0,
  })

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
    logger.error(
      'console.bug_report.create.failed',
      {
        bugReportId: newBugReport.id,
        platform: newBugReport.platform,
        error,
      },
      'Failed to create bug report',
    )
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
    logger.warn('console.bug_report.discord_webhook_missing')
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
    logger.error(
      'console.bug_report.discord_notify_failed',
      {
        bugReportId: bugReport.id,
        error: err,
      },
      'Failed to send Discord webhook',
    )
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
