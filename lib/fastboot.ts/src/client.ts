import { BlobWriter, Entry } from "@zip.js/zip.js"
import { IMAGES } from "./images"
import { parseBlobHeader, splitBlob, fromRaw } from "./sparse"
import { FastbootDevice } from "./device"

export class FastbootError extends Error {}

const FastbootUSBDeviceFilter = {
  classCode: 0xff,
  subclassCode: 0x42,
  protocolCode: 0x03,
}

interface Logger {
  log(message: string): void
}

// higher level API to interact with fastboot device
// translates CLI commands to
export class FastbootClient {
  fd: FastbootDevice
  logger: Logger

  constructor(usb_device: USBDevice, logger: Logger = window.console) {
    this.fd = new FastbootDevice(usb_device, logger)
    this.logger = logger
  }

  async getVar(variable: string) {
    return this.fd.getVar(variable)
  }

  async lock() {
    await this.flashing("lock")
    if (await this.unlocked()) {
      throw new FastbootError("failed to lock device")
    }
  }

  async unlock() {
    await this.flashing("unlock")
    if (await this.locked()) {
      throw new FastbootError("failed to unlock device")
    }
  }

  async reboot() {
    this.logger.log("rebooting")
    await this.fd.exec("reboot")
  }

  async rebootBootloader() {
    this.logger.log("rebooting into bootloader")
    this.fd.exec("reboot-bootloader")
    await this.fd.waitForReconnect()
  }

  async rebootFastboot() {
    this.logger.log("rebooting into fastboot")
    this.fd.exec("reboot-fastboot")
    await this.fd.waitForReconnect()
  }

  async doFlash(
    partition: string,
    blob: Blob,
    slot: "current" | "other" | "a" | "b" = "current",
    applyVbmeta: boolean = false,
  ) {
    // add _a or _b
    //    !(await this.isUserspace()) ?
    if (partition !== "avb_custom_key" && (await this.getVar(`has-slot:${partition}`)) === "yes") {
      if (slot === "current") {
        partition += "_" + (await this.currentSlot())
      } else if (slot === "other") {
        partition += "_" + (await this.otherSlot())
      } else if (slot === "a" || slot === "b") {
        partition += "_" + slot
      } else {
        throw new FastbootError(`Unknown Slot: ${slot}`)
      }
    }

    const { blobSize, totalBytes, isSparse } = await parseBlobHeader(blob)

    // should_flash_in_userspace() ?
    // Logical partitions need to be resized before flashing because
    // they're sized perfectly to the payload.
    if ((await this.isUserspace()) && (await this.getVar(`is-logical:${partition}`)) === "yes") {
      await this.resizePartition(partition, totalBytes)
    }

    const max = await this.maxDownloadSize()

    if (blobSize > max && !isSparse) {
      this.logger.log(`${partition} image is raw, converting to sparse`)
      blob = await fromRaw(blob)
    }

    this.logger.log(`Flashing ${totalBytes} bytes to ${partition} w/ max ${max} bytes per split`)

    let splits = 0
    let sentBytes = 0
    for await (const split of splitBlob(blob, max)) {
      await this.fd.transferData(split.data)
      this.logger.log(`run command flash:${partition}`)
      await this.fd.sendCommand(`flash:${partition}`)
      sentBytes += split.bytes
      splits += 1
      this.logger.log(
        `${partition} #${splits}) sent ${split.bytes} bytes. ${sentBytes}/${blobSize}`,
      )
    }
    this.logger.log(`Flashed ${partition} with ${splits} split(s). Bytes sent: ${sentBytes}`)
  }

  // fb->ResizePartition ?
  async resizePartition(name: string, totalBytes: number) {
    // As per AOSP fastboot, we reset the partition to 0 bytes first
    // to optimize extent allocation before setting the actual size.
    await this.fd.sendCommand(`resize-logical-partition:${name}:0`)
    await this.fd.sendCommand(`resize-logical-partition:${name}:${totalBytes}`)
  }

  async flashing(command: "unlock" | "lock") {
    if (
      (command === "unlock" && (await this.unlocked())) ||
      (command === "lock" && (await this.locked()))
    ) {
      return true
    }

    this.logger.log(`ACTION NEEDED: flashing ${command}`)
    await this.fd.exec(`flashing ${command}`)
    await this.fd.waitForReconnect()
  }

  // run text, typically the contents of fastboot-info.txt
  async fastbootInfo(entries: Entry[], text: string, wipe: boolean = false) {
    const lines = text
      .split("\n")
      .map((x) => x.trim())
      .filter((l) => !(l == "" || l[0] == "#" || l.slice(0, 7) == "version"))

    for (const line of lines) {
      this.logger.log(`fastboot-info: ${line}`)
      const parts = line.split(" ").map((x) => x.trim())
      const command = parts.shift()

      switch (command) {
        case "flash": {
          let slot = "current"
          let applyVbmeta = false
          let partition = null
          let filename = null

          for (const arg of parts) {
            if (arg === "--slot-other") {
              slot = "other"
            } else if (arg === "--apply-vbmeta") {
              applyVbmeta = true
            } else if (partition == null) {
              partition = arg
            } else {
              filename = arg
            }
          }

          if (filename === null) {
            filename = IMAGES.find((img) => img["nickname"] === partition)?.img_name
            if (!filename) {
              throw new Error(`Unknown partition: ${partition}`)
            }
          }

          const entry = entries.find((e) => e.filename === filename)
          if (!entry) {
            throw new Error(
              `partition ${partition} with filename ${filename} not found in zipfile.`,
            )
          }
          this.logger.log(`Extracting ${filename}`)
          const blob = await entry.getData(new BlobWriter("application/octet-stream"))
          this.logger.log(`flashing partition ${partition} with ${filename} from nested zip`)
          await this.doFlash(partition, blob, slot, applyVbmeta)
          break
        }
        case "reboot":
          if (parts[0] === "fastboot") {
            await this.rebootFastboot()
          } else {
            await this.rebootBootloader()
          }
          break
        case "update-super": {
          await this.updateSuper(entries, wipe)
          break
        }
        case "if-wipe":
          if (wipe && parts[0] === "erase" && parts[1]) {
            await this.erase(parts[1])
          }
          break
        case "erase":
          await this.erase(parts[0])
          break
        default:
          throw new Error(`unknown command ${command}`)
      }
    }
  }

  async updateSuper(entries: Entry[], wipe: boolean) {
    const superEmptyImage = entries.find((e) => e.filename === "super_empty.img")
    if (!superEmptyImage) {
      throw new FastbootError(`super_empty.img not found`)
    }

    let superName = "super"
    try {
      superName = await this.getVar("super-partition-name")
    } catch (err) {}

    // fastboot-info does this
    // await this.rebootFastboot()

    const blob = await superEmptyImage.getData(new BlobWriter("application/octet-stream"))
    const buffer = await blob.arrayBuffer()

    await this.fd.transferData(buffer)
    await this.fd.sendCommand(`update-super:${superName}${wipe ? ":wipe" : ""}`)
  }

  async erase(partition: string) {
    return this.fd.exec(`erase:${partition}`)
  }

  async setActiveOtherSlot() {
    const otherSlot = await this.otherSlot()
    return await this.fd.exec(`set_active:${otherSlot}`)
  }

  async maxDownloadSize() {
    try {
      const deviceMax = parseInt(await this.getVar("max-download-size"), 16)
      const upperLimit = 1024 * 1024 * 1024 * 1 // 1 GiB
      return Math.min(deviceMax, upperLimit)
    } catch (err) {
      console.debug(err)
    }
    // FAIL or empty variable means no max, set a reasonable limit to conserve memory
    return 512 * 1024 * 1024 // 512 MiB
  }

  async unlocked() {
    return (await this.getVar("unlocked")) === "yes"
  }

  async locked() {
    return (await this.getVar("unlocked")) === "no"
  }

  async currentSlot() {
    return this.getVar("current-slot")
  }

  async otherSlot() {
    const currentSlot = await this.getVar("current-slot")
    if (currentSlot === "a") {
      return "b"
    } else if (currentSlot === "b") {
      return "a"
    } else {
      throw new Error(`Unable to determine other slot, current slot: ${currentSlot}`)
    }
  }

  async isUserspace() {
    return (await this.getVar("is-userspace")) === "yes"
  }

  static async create() {
    return new FastbootClient(await this.requestUsbDevice(), window.console)
  }

  static requestUsbDevice(): Promise<USBDevice> {
    return window.navigator.usb.requestDevice({
      filters: [FastbootUSBDeviceFilter],
    })
  }
}
