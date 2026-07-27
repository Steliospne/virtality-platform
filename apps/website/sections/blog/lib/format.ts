/** Display-only date: content stores YYYY-MM-DD. */
export function formatPostDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function youtubeEmbedUrl(watchUrl: string): string | null {
  try {
    const url = new URL(watchUrl)
    const id =
      url.searchParams.get('v') ??
      (url.hostname.includes('youtu.be')
        ? url.pathname.replace(/^\//, '')
        : null)
    if (!id) return null
    return `https://www.youtube.com/embed/${id}`
  } catch {
    return null
  }
}
