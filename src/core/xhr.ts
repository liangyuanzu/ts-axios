import { AxiosRequestConfig, AxiosResponse, AxiosPromise } from '../types'
import { CONTENT_TYPE } from '../const'
import { parseHeaders } from '../helpers/headers'
import { createError } from '../helpers/error'
import { isURLSameOrigin } from '../helpers/url'
import cookie from '../helpers/cookie'

export default function xhr(config: AxiosRequestConfig): AxiosPromise {
  return new Promise((resolve, reject) => {
    const {
      url,
      method = 'get',
      data = null,
      headers,
      responseType,
      timeout,
      cancelToken,
      withCredentials,
      xsrfCookieName,
      xsrfHeaderName
    } = config

    const request = new XMLHttpRequest()

    if (responseType) request.responseType = responseType

    if (timeout) request.timeout = timeout

    if (withCredentials) request.withCredentials = withCredentials

    request.open(method.toUpperCase(), url!, true)

    request.onreadystatechange = () => {
      if (request.readyState !== 4 || request.status === 0) return

      const responseHeaders = parseHeaders(request.getAllResponseHeaders())
      const responseData = responseType === 'text' ? request.responseText : request.response
      const response: AxiosResponse = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config,
        request
      }
      handleResponse(response)
    }

    function handleResponse(response: AxiosResponse): void {
      const { status } = response
      if ((status >= 200 && status < 300) || status === 304) {
        resolve(response)
      } else {
        reject(
          createError(`Request failed with status code ${status}`, config, null, request, response)
        )
      }
    }

    request.onerror = (): void => {
      reject(createError('Network Error', config, null, request))
    }

    request.ontimeout = (): void => {
      reject(createError(`Timeout of ${timeout} ms exceeded`, config, 'ECONNABORTED', request))
    }

    if ((withCredentials || isURLSameOrigin(url!)) && xsrfCookieName) {
      const xsrfValue = cookie.get(xsrfCookieName)
      if (xsrfValue && xsrfHeaderName) {
        headers[xsrfHeaderName] = xsrfValue
      }
    }

    Object.keys(headers).forEach(key => {
      if (data === null && key.toUpperCase() === CONTENT_TYPE) {
        delete headers[key]
      } else {
        request.setRequestHeader(key, headers[key])
      }
    })

    processCancel()

    request.send(data)

    async function processCancel() {
      if (cancelToken) {
        try {
          const reason = await cancelToken.promise
          request.abort()
          reject(reason)
        } catch (e) {
          console.log(e)
        }
      }
    }
  })
}
