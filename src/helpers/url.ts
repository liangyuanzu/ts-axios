import { isDate, isPlainObject } from './util'
import { URLOrigin } from '../types'

function encode(val: any): string {
  return encodeURIComponent(val)
    .replace(/%40/g, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']')
}

export function buildURL(url: string, params: any): string {
  if (!params) return url

  const parts: string[] = []

  for (let [key, val] of Object.entries(params)) {
    if (val == null) continue
    let values: string[] = []
    if (Array.isArray(val)) {
      values = val
      key += '[]'
    } else {
      values = [<any>val]
    }
    values.forEach(v => {
      if (isDate(v)) {
        v = v.toISOString()
      } else if (isPlainObject(v)) {
        v = JSON.stringify(v)
      }
      parts.push(`${encode(key)}=${encode(v)}`)
    })
  }

  const serializedParams = parts.join('&')
  if (serializedParams) {
    const markIndex = url.indexOf('#')
    if (markIndex !== -1) url = url.slice(0, markIndex)
    const str = url.indexOf('?') === -1 ? '?' : '&'
    url += str + serializedParams
  }

  return url
}

function resolveURL(url: string): URLOrigin {
  const urlParsingNode = document.createElement('a')
  urlParsingNode.setAttribute('href', url)
  const { protocol, host } = urlParsingNode

  return {
    protocol,
    host
  }
}

export function isURLSameOrigin(requestURL: string): boolean {
  const parsedOrigin = resolveURL(requestURL)
  return parsedOrigin.protocol === location.protocol && parsedOrigin.host === location.host
}
