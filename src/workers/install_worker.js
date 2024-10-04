import { FastbootDevice} from "android-fastboot"
import OpfsBlobStore from 'opfs_blob_store'

async function start(data) {
  if (!data.serialNumber || !data.sha256) {
    throw new Error("event data missing")
  }

  try {
    let device = new FastbootDevice()
    device.connect(data.serialNumber)

    const blob = await bs.get(data.sha256)

    await device.flashFactoryZip(
      blob,
      true,  // we only support clean install right now
      () => {
        postMessage({ "type": "reconnect" })
      },
      (action, item, progress) => {
        postMessage({ "type": "progress", "action": action "item": item "progress": progress })
      }
    )

    postMessage({ "type": "complete" })
    return true
  } catch(e) {
    postMessage( { "type": "error", e: e })
    return false
  }
}

onmessage = function(e) {
  var started = false

  if (e.data.type === 'start') {
    if (started) {
      throw new Error(`already started`)
    } else {
      started = true
      start(e.data)
    }
  } else {
    throw new Error(`unknown type: ${e.data.type}`)
  }
}
