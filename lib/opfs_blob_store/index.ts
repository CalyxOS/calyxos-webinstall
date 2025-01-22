import jsSHA from "jssha"

export class ShasumVerificationError extends Error {
  constructor(actual, expected) {
    super(`verification failed\nactual: ${actual}\nexpected: ${expected}`)
    this.name = "ShasumVerificationError"
  }
}

export default class OpfsBlobStore {
  static TopLevelDirectory = "default"
  rootDirectoryHandle: FileSystemDirectoryHandle
  downloading: boolean

  static async create() {
    return new OpfsBlobStore(
      await navigator.storage
        .getDirectory()
        .then(opfsRoot =>
          opfsRoot.getDirectoryHandle(OpfsBlobStore.TopLevelDirectory, { create: true }),
        ),
    )
  }

  constructor(rootDirectoryHandle: FileSystemDirectoryHandle) {
    this.rootDirectoryHandle = rootDirectoryHandle
    this.downloading = false
  }

  async keys(): Promise<Array<string>> {
    return Array.fromAsync(this.rootDirectoryHandle.keys()) // chrome 121+
  }

  async verify(key: string, onProgress: (i: number) => void | undefined) {
    const file = await this.get(key)
    const fileSize = file.size
    let shaObj = new jsSHA("SHA-256", "UINT8ARRAY")
    let bytesRead = 0

    for await (const chunk of file.stream()) {
      shaObj.update(chunk)
      bytesRead += chunk.length

      if (onProgress) {
        onProgress(bytesRead / fileSize)
      }
    }

    const hash = shaObj.getHash("HEX")

    if (hash !== key) {
      throw new ShasumVerificationError(hash, key)
    } else {
      return Promise.resolve(true)
    }
  }

  async has(key: string) {
    try {
      await this.rootDirectoryHandle.getFileHandle(key)
      return true
    } catch (e) {
      if (e instanceof DOMException && e.name === "NotFoundError") {
        return false
      } else {
        throw e
      }
    }
  }

  async get(key: string): Promise<File> {
    if (!(await this.has(key))) {
      throw new DOMException(`${key} not found.`, "NotFoundError")
    }
    return this.rootDirectoryHandle.getFileHandle(key).then(handler => handler.getFile())
  }

  async delete(key: string) {
    if (await this.has(key)) {
      await this.rootDirectoryHandle.removeEntry(key)
    }
  }

  async clear() {
    for (const key of await this.keys()) {
      await this.delete(key)
    }
  }

  // KEY is sha256sum of file located at URL
  // onProgress is called with ratio of data received
  // sha256 is checked while downloading
  async fetch(key: string, url: string, onProgress: (i: number) => void | undefined) {
    this.downloading = true
    if (await this.has(key)) {
      throw new DOMException(`${key} already exists.`, "OperationError")
    }

    let contentLength: number
    let fileHandle = await this.rootDirectoryHandle.getFileHandle(key, { create: true })
    let fileStream = await fileHandle.createWritable() // FileSystemWritableFileStream

    return fetch(url)
      .then(response => {
        if (response.status !== 200) {
          throw new DOMEError(`http error. status code: ${response.status}`)
        } else if (!response.headers.get("content-length")) {
          throw new Error(`response for ${url} is missing content-length header`)
        }

        contentLength = Number(response.headers.get("content-length"))
        let contentType = response.headers.get("content-type")
        console.debug(`downloading ${url}. length: ${contentLength}. type: ${contentType}.`)
        return response
      })
      .then(response => {
        let bytesReceived = 0
        let shaObj = new jsSHA("SHA-256", "UINT8ARRAY")
        const reader = response.body.getReader()

        return new ReadableStream({
          async start(controller) {
            console.debug(`start download ${url} at ${Date.now().toString()}`)
            while (true) {
              const { done, value } = await reader.read() // value is Uint8array

              if (done) {
                console.debug(`stop download ${url} at ${Date.now().toString()}`)
                const hash = shaObj.getHash("HEX")

                if (hash !== key) {
                  throw new ShasumVerificationError(hash, key)
                }
                break
              }

              shaObj.update(value)
              controller.enqueue(value)
              bytesReceived += value.length

              if (onProgress) {
                onProgress(bytesReceived / contentLength)
              }
            }
            controller.close()
            reader.releaseLock()
          },
        })
      })
      .then(stream => stream.pipeTo(fileStream))
      .finally(() => {
        this.downloading = false
      })
  }
}
