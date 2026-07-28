import type { LinkPreview } from '@/types/api'

const URL_REGEX = /https?:\/\/[^\s]+/gi

export function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) || []
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return ''
  }
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`
    const resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) })
    if (!resp.ok) return null

    const html = await resp.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const getMeta = (property: string): string => {
      const el =
        doc.querySelector(`meta[property="${property}"]`) ||
        doc.querySelector(`meta[name="${property}"]`)
      return el?.getAttribute('content') || ''
    }

    const title = getMeta('og:title') || doc.querySelector('title')?.textContent || ''
    const description = getMeta('og:description') || getMeta('description') || ''
    let image = getMeta('og:image') || ''

    if (image && !image.startsWith('http')) {
      try {
        image = new URL(image, url).href
      } catch {
        image = ''
      }
    }

    if (!title && !description && !image) return null

    return {
      url,
      title: title.slice(0, 200),
      description: description.slice(0, 300),
      image,
      domain: getDomain(url),
    }
  } catch {
    return null
  }
}
