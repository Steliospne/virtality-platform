export function isImageContentType(contentType: string): boolean {
  return contentType.startsWith('image/')
}

export function isVideoContentType(contentType: string): boolean {
  return contentType.startsWith('video/')
}
