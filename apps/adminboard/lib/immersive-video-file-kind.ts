/**
 * What an admin hands the catalog. The kind is a picker-side choice only: a
 * bundle keeps the filename Unity generated so the Addressables catalog can
 * resolve it; a raw video is stored as `<videoId>.<ext>`.
 */
export type ImmersiveVideoFileKind = 'bundle' | 'video'

export const DEFAULT_IMMERSIVE_VIDEO_FILE_KIND: ImmersiveVideoFileKind =
  'bundle'

type FileKindSpec = {
  label: string
  extensions: readonly string[]
  accept: string
  hint: string
  unsupported: string
}

const FILE_KINDS: Record<ImmersiveVideoFileKind, FileKindSpec> = {
  bundle: {
    label: 'Unity AssetBundle',
    extensions: ['bundle'],
    accept: '.bundle',
    hint: "A .bundle from the headset project's Addressables build for Android, one video per bundle. It keeps the filename Unity gave it (the catalog resolves it by name), and the Video ID must match its Addressables address. Duration is not read from bundles.",
    unsupported: "This file isn't a Unity AssetBundle. Pick a .bundle file.",
  },
  video: {
    label: 'Raw video',
    extensions: ['mp4', 'm4v', 'mov', 'webm', 'mkv'],
    accept: 'video/*,.mp4,.m4v,.mov,.webm,.mkv',
    hint: 'MP4 (H.264/H.265) is the format the headset is tested with.',
    unsupported:
      "This file type isn't supported. Use MP4, M4V, MOV, WEBM or MKV.",
  },
}

export const IMMERSIVE_VIDEO_FILE_KINDS = Object.keys(
  FILE_KINDS,
) as ImmersiveVideoFileKind[]

export function immersiveVideoFileKindSpec(
  kind: ImmersiveVideoFileKind,
): FileKindSpec {
  return FILE_KINDS[kind]
}

export function immersiveVideoAcceptAll(): string {
  return IMMERSIVE_VIDEO_FILE_KINDS.map((kind) => FILE_KINDS[kind].accept).join(
    ',',
  )
}

function fileExtension(filename: string): string | null {
  const trimmed = filename.trim()
  const dot = trimmed.lastIndexOf('.')
  if (dot <= 0 || dot === trimmed.length - 1) {
    return null
  }
  return trimmed.slice(dot + 1).toLowerCase()
}

/** The kind a filename belongs to, or null when no kind accepts it. */
export function immersiveVideoFileKindOf(
  filename: string,
): ImmersiveVideoFileKind | null {
  const extension = fileExtension(filename)
  if (!extension) {
    return null
  }
  return (
    IMMERSIVE_VIDEO_FILE_KINDS.find((kind) =>
      FILE_KINDS[kind].extensions.includes(extension),
    ) ?? null
  )
}

export function isAllowedImmersiveVideoFilename(
  filename: string,
  kind: ImmersiveVideoFileKind,
): boolean {
  return immersiveVideoFileKindOf(filename) === kind
}

/** Mirrors the server pattern: safe as an S3 key segment, headset filename and URL path segment. */
export const IMMERSIVE_VIDEO_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/

export const IMMERSIVE_VIDEO_ID_HINT =
  'Shared by headsets, the console and the file name. Lowercase letters, digits, dots, dashes and underscores; up to 64 characters. Leave blank to keep the generated one. Fixed after the first upload.'

export const IMMERSIVE_VIDEO_ID_INVALID =
  'Video ID must start with a letter or digit and use only lowercase letters, digits, dots, dashes and underscores (max 64).'

export function isValidImmersiveVideoId(id: string): boolean {
  return IMMERSIVE_VIDEO_ID_PATTERN.test(id)
}

/** A blank or unchanged Video ID means "keep the generated one". */
export function requestedImmersiveVideoId(
  input: string,
  currentId: string,
): string | null {
  const trimmed = input.trim()
  if (trimmed === '' || trimmed === currentId) {
    return null
  }
  return trimmed
}

export function canChooseImmersiveVideoId(row: {
  version: number
  filename: string | null
  sizeBytes: number | null
}): boolean {
  return (
    row.version === 0 && !row.filename && !(row.sizeBytes && row.sizeBytes > 0)
  )
}
