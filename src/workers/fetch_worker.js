import OpfsBlobStore from "opfs_blob_store"

async function start(data) {
  if (!data.sha256 || !data.url) {
    throw new Error("event data missing")
  }

  const onProgress = (i) => {
    postMessage({ type: "progress", i: i })
  }

  try {
    const bs = await OpfsBlobStore.create()
    await bs.fetch(data.sha256, data.url, onProgress)
    postMessage({ type: "complete" })
    return true
  } catch (e) {
    postMessage({ type: "error", e: e })
    return false
  }
}

onmessage = function (e) {
  if (e.data.type === "start") {
    start(e.data)
  } else {
    throw new Error(`unknown type: ${e.data.type}`)
  }
}
