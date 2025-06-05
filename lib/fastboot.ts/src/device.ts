type CommandPacket = {
  command: string
}

type ResponsePacket = {
  status: "OKAY" | "FAIL" | "DATA" | "INFO" | "TEXT"
  message?: string
  dataLength?: number
}

type FastbootSession = {
  phase: 1 | 2 | 3 | 4 | 5
  status: null | "OKAY" | "FAIL"
  packets: (CommandPacket | ResponsePacket)[]
}

interface Logger {
  log(message: string): void
}

export class FastbootDeviceError extends Error {
  status: string

  constructor(status: string, message: string) {
    super(`Bootloader replied with ${status}: ${message}`)
    this.status = status
    this.name = "FastbootDeviceError"
  }
}

// implements the fastboot protocol over WebUSB
export class FastbootDevice {
  device: USBDevice
  serialNumber: string;
  in: USBEndpoint
  out: USBEndpoint
  session: FastbootSession
  sessions: FastbootSession[]
  logger: Logger

  constructor(device, logger = window.console) {
    this.device = device
    this.serialNumber = this.device.serialNumber
    this.session = null
    this.sessions = []
    this.logger = logger
    this.setup()
  }

  // validate device and assign endpoints attributes
  setup() {
    if (this.device.configurations.length > 1) {
      console.warn(
        `device has ${device.configurations.length} configurations. Using the first one.`,
      )
    }

    // this.in = this.device.configurations[0].interfaces[0].alternate.endpoints[0]
    const endpoints = this.device.configurations[0].interfaces[0].alternate.endpoints

    if (endpoints.length !== 2) {
      throw new Error("USB Interface must have only 2 endpoints")
    }

    for (const endpoint of endpoints) {
      if (endpoint.direction === "in") {
        this.in = endpoint
      } else if (endpoint.direction === "out") {
        this.out = endpoint
      } else {
        throw new Error(`Endpoint error: ${endpoint}`)
      }
    }
  }

  async connect() {
    if (!this.device.opened) {
      await this.device.open()
    }
    await this.device.selectConfiguration(1)
    await this.device.claimInterface(0)
  }

  // some commands (like "flashing lock") will disconnect the device
  // we have to re-assign this.device after it reconnects
  async reconnect() {
    const devices = await navigator.usb.getDevices()
    for (const device of devices) {
      if (device.serialNumber === this.serialNumber) {
        this.device = device
        this.setup()
        await this.connect()
        return true
      }
    }
    throw new Error("Could not find device in navigator.usb.getDevices()")
  }

  waitForReconnect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      navigator.usb.addEventListener(
        "connect",
        async (event) => {
          this.logger.log(`waitForReconnect: device connected ${event.device.productName}`)
          try {
            await this.reconnect()
            resolve(true)
          } catch (e) {
            reject(e)
          }
        },
        { once: true },
      )
    })
  }

  async getPacket(): ResponsePacket {
    this.logger.log(`receiving packet from endpoint ${this.in.endpointNumber}`)
    const inPacket = await this.device.transferIn(this.in.endpointNumber, 256)
    const inPacketText = new TextDecoder().decode(inPacket.data)
    const status = inPacketText.substring(0, 4)
    const message = inPacketText.slice(4).trim()
    switch (status) {
      case "INFO":
        return { status, message: `(bootloader)  ${message}` }
      case "TEXT":
        return { status, message }
      case "FAIL":
        return { status, message }
      case "OKAY":
        return { status, message }
      case "DATA": {
        const dataLength = parseInt(inPacketText.slice(4, 12), 16)
        return {
          status,
          dataLength,
          message: `ready to transfer ${dataLength} bytes`,
        }
      }
      default:
        throw new Error(`invalid packet: ${inPacketText}`)
    }
  }

  async getPackets() {
    let response
    do {
      response = await this.getPacket()
      this.session.packets.push(response)
      this.logger.log(`[${response.status}] ${response.message}`)
    } while (["INFO", "TEXT"].includes(response.status))
  }

  async sendCommand(text): ResponsePacket {
    this.session.packets.push({ command: text } as CommandPacket)
    const outPacket = new TextEncoder().encode(text)
    this.logger.log(`transfering "${text}" to endpoint ${this.out.endpointNumber}`)
    const result: USBOutTransferResult = await this.device.transferOut(
      this.out.endpointNumber,
      outPacket,
    )
    await this.getPackets()

    if (this.lastPacket.status === "FAIL") {
      this.session.status = "FAIL"
      throw new FastbootDeviceError(this.lastPacket.status, this.lastPacket.message)
    } else {
      return this.lastPacket
    }
  }

  async exec(command): ResponsePacket {
    if (this.isActive) {
      throw new Error("fastboot device is busy")
    } else if (!this.device.opened) {
      await this.connect()
    }

    if (this.session) {
      this.sessions.push(this.session)
    }

    this.session = { status: null, packets: [] }

    return this.sendCommand(command)
  }

  async getVar(variable: FastbootClientVariables): Promise<string> {
    await this.exec(`getvar:${variable}`)
    return this.lastPacket.message
  }

  get lastPacket() {
    return this.session.packets[this.session.packets.length - 1]
  }

  get isActive() {
    if (!this.session || this.session.packets.length === 0) {
      return false
    }

    return !["FAIL", "OKAY"].includes(this.lastPacket.status)
  }

  // send buffer to phone
  // download:00001234 -> "DATA" -> transferOut -> "OKAY"
  async transferData(buffer: ArrayBuffer) {
    // Bootloader requires an 8-digit hex number
    const xferHex = buffer.byteLength.toString(16).padStart(8, "0")
    if (xferHex.length !== 8) {
      throw new FastbootDeviceError(
        "FAIL",
        `Transfer size overflow: ${xferHex} is more than 8 digits`,
      )
    }

    this.logger.log(`Sending command download:${xferHex}.`)
    const response = await this.sendCommand(`download:${xferHex}`)

    if (response.status !== "DATA") {
      throw new FastbootDeviceError(
        "FAIL",
        `response to download:${xferHex} is ${response.status}. Expected DATA.`,
      )
    } else if (response.dataLength !== buffer.byteLength) {
      throw new FastbootDeviceError(
        "FAIL",
        `Bootloader wants ${response.dataLength} bytes, requested to send ${buffer.byteLength} bytes`,
      )
    }

    const BULK_TRANSFER_SIZE = 16384
    this.logger.log(`Sending payload: ${buffer.byteLength} bytes`)
    let i = 0
    let remainingBytes = buffer.byteLength
    while (remainingBytes > 0) {
      const chunk = buffer.slice(i * BULK_TRANSFER_SIZE, (i + 1) * BULK_TRANSFER_SIZE)
      if (i % 1000 === 0) {
        this.logger.log(
          `Sending ${chunk.byteLength} bytes to endpoint, ${remainingBytes} remaining, i=${i}`,
        )
      }
      await this.device.transferOut(this.out.endpointNumber, chunk)
      remainingBytes -= chunk.byteLength
      i += 1
    }
    this.logger.log("Payload sent, waiting for response...")
    await this.getPackets()
  }
}
