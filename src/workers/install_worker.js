import { FastbootDevice} from "android-fastboot"
import OpfsBlobStore from 'opfs_blob_store'

async function start(data) {
  try {
    if (!data.sha256) {
      throw new Error("event data missing")
    }

    // USBDevice/FastbootDevice is not transferable
    const devices = (await navigator.usb.getDevices())
    if (devices.length !== 1) {
      throw new Error('more than one usb device connected')
    }

    const device = new FastbootDevice(devices[0])

    while (!device.isConnected) {
      await device.connect()
      await (new Promise(resolve => setTimeout(resolve, 1000)))
    }

    const blob = await(await OpfsBlobStore.create()).get(data.sha256)

    await device.flashFactoryZip(
      blob,
      true,  // we only support clean install right now
      () => {
        postMessage({ "type": "reconnect" })
      },
      (action, item, progress) => {
        postMessage({ "type": "progress",
                      "action": action,
                      "item": item,
                      "progress": progress })
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
      console.log(e)
      start(e.data)
    }
  } else {
    throw new Error(`unknown type: ${e.data.type}`)
  }
}
