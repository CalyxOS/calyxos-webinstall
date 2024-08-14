import jsSHA from "jssha"

export default class OpfsBlobStore {
  static TopLevelDirectory = "default"
  rootDirectoryHandle: FileSystemDirectoryHandle
  downloading: boolean

  static async create() {
    return new OpfsBlobStore(await navigator.storage.getDirectory().then(opfsRoot =>
      opfsRoot.getDirectoryHandle(OpfsBlobStore.TopLevelDirectory, { create: true })
    ))
  }

  constructor(rootDirectoryHandle: FileSystemDirectoryHandle) {
    this.rootDirectoryHandle = rootDirectoryHandle
    this.downloading = false
  }

  async keys(): Promise<Array<string>> {
    return Array.fromAsync(this.rootDirectoryHandle.keys()) // chrome 121+
  }

  async verify(key: string) {
    return this.get(key)
      .then(file => file.stream())
      .then(stream => stream.getReader())
      .then(async reader => {
        let shaObj = new jsSHA("SHA-256", "UINT8ARRAY")
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            return shaObj
          } else {
            shaObj.update(value)
          }
        }
      })
      .then(shaObj => {
        if (shaObj.getHash("HEX") !== key) {
          throw new Error("shasum verification failed")
        } else {
          return Promise.resolve(true)
        }
      })
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

  // KEY is sha256sum of file located at URL
  // onProgress is called with ratio of data received
  async fetch(key: string, url: string, onProgress: (i: number) => void | undefined) {
    if (await this.has(key)) {
      throw new DOMException(`${key} already exists.`, "OperationError")
    }

    this.downloading = true

    let contentLength: number
    let fileHandle = await this.rootDirectoryHandle.getFileHandle(key, { create: true })
    let fileStream = await fileHandle.createWritable() // FileSystemWritableFileStream
    let shaObj = new jsSHA("SHA-256", "UINT8ARRAY")

    return fetch(url)
      .then(response => {
        if (!response.headers.get("content-length")) {
          throw new Error(`response for ${url} is missing content-length header`)
        }
        contentLength = Number(response.headers.get("content-length"))
        let contentType = response.headers.get("content-type")
        console.debug(`downloading ${url}. length: ${contentLength}. type: ${contentType}.`)
        return response
      })
      .then(response => {
        let bytesReceived = 0
        const reader = response.body.getReader()

        return new ReadableStream({
          async start(controller) {
            while (true) {
              const { done, value } = await reader.read() // value is Uint8array

              if (done) {
                console.debug("Finished downloading ", url)
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
      .then(async () => {
        if (shaObj.getHash("HEX") !== key) {
          await this.delete(key)
          throw new Error("shasum verification failed")
        } else {
          return Promise.resolve(true)
        }
      })
      .finally(() => {
        this.downloading = false
      })
  }
}
