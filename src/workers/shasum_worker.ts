/// <reference lib="webworker" />
import OpfsBlobStore from "opfs_blob_store"

declare const self: DedicatedWorkerGlobalScope

interface StartMessage {
  type: "start"
  sha256: string
}

async function start(data: StartMessage) {
  if (!data.sha256) {
    throw new Error("event data missing")
  }

  const onProgress = (i: number) => {
    self.postMessage({ type: "progress", i: i })
  }

  try {
    const bs = await OpfsBlobStore.create()
    await bs.verify(data.sha256, onProgress)
    self.postMessage({ type: "complete" })
    return true
  } catch (e) {
    self.postMessage({ type: "error", e: e })
    return false
  }
}

self.onmessage = function (e: MessageEvent<StartMessage>) {
  if (e.data.type === "start") {
    void start(e.data)
  } else {
    throw new Error(`unknown type: ${e.data.type}`)
  }
}
