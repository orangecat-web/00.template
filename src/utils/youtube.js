// Accept common YouTube share and embed URLs; keep IDs out of presentation components.
export function getYouTubeId(src) {
  try {
    const url = new URL(src)
    if (url.protocol !== 'https:') return ''
    const host = url.hostname.replace(/^www\./, '')
    let id = ''
    if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0]
    if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] || ''
    }
    return /^[\w-]{11}$/.test(id) ? id : ''
  } catch {
    return ''
  }
}

export function youtubeThumbnail(id, quality = 'maxresdefault') {
  return id ? `https://i.ytimg.com/vi/${id}/${quality}.jpg` : ''
}
