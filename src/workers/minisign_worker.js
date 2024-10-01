import OpfsBlobStore from 'opfs_blob_store'
import MinisignVerify from 'minisign_verify'

async function fetchSignature(url) {
  const signatureUrl = url + ".minisig"
  return fetch(signatureUrl)
    .then( (response) => {
      if (!response.ok) {
        throw new Error(`Request to ${signatureUrl} failed. Status code: ${response.status}`)
      }
      return response.text()
    })
}

async function start(data) {
  if (!data.url || !data.sha256) {
    throw new Error("event data missing")
  }

  const onProgress = (i) => {
    postMessage({ "type": "progress", i: i })
  }

  try {
    const bs = await OpfsBlobStore.create()

    const [file, signatureFile] = await Promise.all([
      bs.get(data.sha256),
      fetchSignature(data.url)
    ])

    await MinisignVerify.verify(file, signatureFile, onProgress)
    postMessage({ "type": "complete" })
    return true
  } catch(e) {
    postMessage( { "type": "error", e: e })
    return false
  }
}

onmessage = function(e) {
  if (e.data.type === 'start') {
    start(e.data)
  } else {
    throw new Error(`unknown type: ${e.data.type}`)
  }
}
