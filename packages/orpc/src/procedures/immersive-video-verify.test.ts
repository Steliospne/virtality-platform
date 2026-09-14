import { describe, expect, it, vi } from 'vitest'
import type { ImmersiveVideoRecord } from './immersive-video-constants.ts'
import type { ImmersiveVideoS3 } from './immersive-video-s3.ts'
import {
  runImmersiveVideoVerify,
  type ImmersiveVideoPrisma,
} from './immersive-video-service.ts'

const NOW = new Date('2026-09-12T12:00:00.000Z')

function verifyingRow(
  overrides: Partial<ImmersiveVideoRecord> = {},
): ImmersiveVideoRecord {
  return {
    id: 'video-1',
    title: 'Trail',
    activity: 'CYCLING',
    description: null,
    state: 'Verifying',
    priorState: 'Draft',
    version: 0,
    objectKey: null,
    sizeBytes: null,
    checksum: null,
    durationSec: null,
    filename: null,
    thumbnailKey: null,
    uploadId: 'upload-1',
    uploadObjectKey: 'immersive-videos/video-1.mp4',
    uploadFilename: 'trail.mp4',
    uploadSizeBytes: BigInt(4),
    uploadDurationSec: 12,
    verifyFailedAt: null,
    publishedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

function createPrisma(initial: ImmersiveVideoRecord) {
  const state = { row: { ...initial } }

  const prisma = {
    immersiveVideo: {
      findUnique: vi.fn(async () => state.row),
      findMany: vi.fn(async () => [state.row]),
      create: vi.fn(),
      update: vi.fn(
        async ({ data }: { data: Partial<ImmersiveVideoRecord> }) => {
          state.row = { ...state.row, ...data }
          return state.row
        },
      ),
      delete: vi.fn(),
    },
    deviceVideo: {
      deleteMany: vi.fn(),
    },
  }

  return { prisma: prisma as unknown as ImmersiveVideoPrisma, state }
}

function createS3(overrides: Partial<ImmersiveVideoS3> = {}): ImmersiveVideoS3 {
  return {
    createMultipartUpload: vi.fn(async () => ({ uploadId: 'upload-1' })),
    uploadPart: vi.fn(async () => undefined),
    listParts: vi.fn(async () => []),
    completeMultipartUpload: vi.fn(async () => undefined),
    abortMultipartUpload: vi.fn(async () => undefined),
    putObject: vi.fn(async () => undefined),
    deleteObject: vi.fn(async () => undefined),
    listObjects: vi.fn(async () => []),
    headObject: vi.fn(async () => ({
      contentLength: 4,
      checksumSha256: 'c29tZS1zdW0=-1',
    })),
    ...overrides,
  }
}

describe('immersive video verify', () => {
  it('promotes upload columns, bumps version 0 to 1, and stores the S3 checksum', async () => {
    const { prisma, state } = createPrisma(verifyingRow())
    const s3 = createS3()

    const row = await runImmersiveVideoVerify('video-1', { prisma, s3 })

    expect(row?.version).toBe(1)
    expect(row?.filename).toBe('trail.mp4')
    expect(row?.sizeBytes).toBe(4)
    expect(row?.durationSec).toBe(12)
    expect(row?.state).toBe('Draft')
    expect(state.row.checksum).toBe('c29tZS1zdW0=-1')
    expect(state.row.objectKey).toBe('immersive-videos/video-1.mp4')
    expect(state.row.uploadId).toBeNull()
    expect(s3.headObject).toHaveBeenCalledWith({
      key: 'immersive-videos/video-1.mp4',
    })
    expect(s3.deleteObject).not.toHaveBeenCalled()
  })

  it('a republish onto the same key keeps one object and bumps the version', async () => {
    const { prisma, state } = createPrisma(
      verifyingRow({
        priorState: 'Published',
        version: 2,
        objectKey: 'immersive-videos/video-1.mp4',
        sizeBytes: BigInt(8),
        checksum: 'old-sum',
        filename: 'old.mp4',
      }),
    )
    const s3 = createS3()

    const row = await runImmersiveVideoVerify('video-1', { prisma, s3 })

    expect(row?.state).toBe('Published')
    expect(row?.version).toBe(3)
    expect(state.row.objectKey).toBe('immersive-videos/video-1.mp4')
    expect(state.row.checksum).toBe('c29tZS1zdW0=-1')
    expect(s3.deleteObject).not.toHaveBeenCalled()
  })

  it('a replace that changes extension deletes the previous key', async () => {
    const { prisma, state } = createPrisma(
      verifyingRow({
        priorState: 'Published',
        version: 1,
        objectKey: 'immersive-videos/video-1.mp4',
        sizeBytes: BigInt(8),
        checksum: 'old-sum',
        filename: 'old.mp4',
        uploadObjectKey: 'immersive-videos/video-1.bundle',
        uploadFilename: 'trail.bundle',
      }),
    )
    const s3 = createS3()

    await runImmersiveVideoVerify('video-1', { prisma, s3 })

    expect(state.row.objectKey).toBe('immersive-videos/video-1.bundle')
    expect(s3.deleteObject).toHaveBeenCalledWith({
      key: 'immersive-videos/video-1.mp4',
    })
  })

  it('on size mismatch deletes the object, sets verifyFailedAt, and returns to Draft', async () => {
    const { prisma, state } = createPrisma(
      verifyingRow({ priorState: 'Draft' }),
    )
    const s3 = createS3({
      headObject: vi.fn(async () => ({
        contentLength: 2,
        checksumSha256: 'c29tZS1zdW0=-1',
      })),
    })

    const row = await runImmersiveVideoVerify('video-1', { prisma, s3 })

    expect(row?.state).toBe('Draft')
    expect(row?.verifyFailedAt).toBeInstanceOf(Date)
    expect(state.row.objectKey).toBeNull()
    expect(s3.deleteObject).toHaveBeenCalledWith({
      key: 'immersive-videos/video-1.mp4',
    })
  })

  it('fails when S3 recorded no checksum for the object', async () => {
    const { prisma, state } = createPrisma(verifyingRow())
    const s3 = createS3({
      headObject: vi.fn(async () => ({
        contentLength: 4,
        checksumSha256: null,
      })),
    })

    const row = await runImmersiveVideoVerify('video-1', { prisma, s3 })

    expect(row?.state).toBe('Draft')
    expect(state.row.objectKey).toBeNull()
    expect(s3.deleteObject).toHaveBeenCalled()
  })

  it('fails when the object cannot be read', async () => {
    const { prisma } = createPrisma(verifyingRow())
    const s3 = createS3({
      headObject: vi.fn(async () => {
        throw new Error('NotFound')
      }),
    })

    const row = await runImmersiveVideoVerify('video-1', { prisma, s3 })

    expect(row?.state).toBe('Draft')
    expect(row?.verifyFailedAt).toBeInstanceOf(Date)
  })

  it('a failed republish onto the live key drops the file and lands in Unpublished', async () => {
    const { prisma, state } = createPrisma(
      verifyingRow({
        priorState: 'Published',
        version: 1,
        objectKey: 'immersive-videos/video-1.mp4',
        sizeBytes: BigInt(8),
        checksum: 'live',
        filename: 'live.mp4',
        durationSec: 30,
      }),
    )
    const s3 = createS3({
      headObject: vi.fn(async () => ({
        contentLength: 2,
        checksumSha256: 'c29tZS1zdW0=-1',
      })),
    })

    const row = await runImmersiveVideoVerify('video-1', { prisma, s3 })

    expect(row?.state).toBe('Unpublished')
    expect(row?.verifyFailedAt).toBeInstanceOf(Date)
    expect(state.row.version).toBe(1)
    expect(state.row.objectKey).toBeNull()
    expect(state.row.checksum).toBeNull()
    expect(state.row.filename).toBeNull()
    expect(state.row.durationSec).toBeNull()
    expect(s3.deleteObject).toHaveBeenCalledWith({
      key: 'immersive-videos/video-1.mp4',
    })
  })

  it('a failed republish onto a different key keeps the live file and returns to Published', async () => {
    const { prisma, state } = createPrisma(
      verifyingRow({
        priorState: 'Published',
        version: 1,
        objectKey: 'immersive-videos/video-1.mp4',
        sizeBytes: BigInt(8),
        checksum: 'live',
        filename: 'live.mp4',
        uploadObjectKey: 'immersive-videos/video-1.bundle',
      }),
    )
    const s3 = createS3({
      headObject: vi.fn(async () => ({
        contentLength: 2,
        checksumSha256: 'c29tZS1zdW0=-1',
      })),
    })

    const row = await runImmersiveVideoVerify('video-1', { prisma, s3 })

    expect(row?.state).toBe('Published')
    expect(state.row.objectKey).toBe('immersive-videos/video-1.mp4')
    expect(state.row.filename).toBe('live.mp4')
    expect(s3.deleteObject).toHaveBeenCalledWith({
      key: 'immersive-videos/video-1.bundle',
    })
    expect(s3.deleteObject).not.toHaveBeenCalledWith({
      key: 'immersive-videos/video-1.mp4',
    })
  })
})
