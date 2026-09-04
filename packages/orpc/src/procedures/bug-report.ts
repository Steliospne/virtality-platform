import { z } from 'zod/v4'
import { BugReportSchema } from '@virtality/db/definitions'
import type { Platform } from '@virtality/db'
import { authed } from '../middleware/auth.ts'
import { generateImageFile, generateUUID } from '@virtality/shared/utils'
import { createAppLogger } from '@virtality/shared/observability'

const bugReportLogger = createAppLogger({
  serviceName: 'server',
  defaultAttributes: {
    component: 'bug-report',
  },
})

const CreateBugReportInput = BugReportSchema.pick({
  title: true,
  platform: true,
  description: true,
}).extend({
  images: z.array(z.instanceof(File)).optional().default([]),
})

type NewBugReport = {
  id: string
  title: string
  description: string
  platform: Platform
  createdAt: Date
}

async function notifyDiscord(bugReport: NewBugReport): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim()

  if (!webhookUrl) {
    bugReportLogger.warn('bug_report.discord_webhook_missing')
    return
  }

  const message = {
    username: 'Bug Reporter 🐞',
    embeds: [
      {
        title: '🐛 New Bug Report',
        color: 0xff0000,
        fields: [
          { name: 'Title', value: bugReport.title, inline: false },
          {
            name: 'Description',
            value: bugReport.description,
            inline: false,
          },
          { name: 'Platform', value: bugReport.platform, inline: false },
          {
            name: 'Created At',
            value: bugReport.createdAt.toLocaleString(),
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
  } catch (error) {
    bugReportLogger.error(
      'bug_report.discord_notify_failed',
      { bugReportId: bugReport.id, error },
      'Failed to send Discord webhook',
    )
  }
}

const createBugReport = authed
  .route({ path: '/bug-report/create', method: 'POST' })
  .input(CreateBugReportInput)
  .handler(async ({ context, input }) => {
    const { prisma, s3 } = context
    const { title, description, platform, images } = input

    const newBugReport: NewBugReport = {
      id: generateUUID(),
      title,
      description,
      platform,
      createdAt: new Date(),
    }

    await prisma.bugReport.create({
      data: { ...newBugReport, updatedAt: newBugReport.createdAt },
    })
    await notifyDiscord(newBugReport)

    const bugReportImages = []
    for (const image of images) {
      const file = await generateImageFile({ image, resource: 'BugReport' })
      if (!file) continue

      await s3.uploadFile({
        Body: file.buffer,
        ContentType: file.ContentType,
        Key: file.Key,
      })

      bugReportImages.push({
        id: generateUUID(),
        bugReportId: newBugReport.id,
        image: file.Key,
      })
    }

    if (bugReportImages.length > 0) {
      await prisma.bugReportImage.createMany({ data: bugReportImages })
    }

    return { id: newBugReport.id }
  })

export const bugReport = {
  create: createBugReport,
}
