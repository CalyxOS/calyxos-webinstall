# fastboot.ts

```sh
pnpm install
pnpm run build
```

    src/device.ts handles interfacing with WebUSB and implements fastboot protocol
    src/client.ts implements higher level API, similar to fastboot cli tool
    src/flasher.ts flashes zip image from a list of instructions
    src/sparse.ts sparse image utilities Copyright (c) 2021 Danny Lin <danny@kdrag0n.dev>

TODO

    --apply-vbmeta
    repack_ramdisk ?

```js
import { FastbootClient, FashbootFlasher } from "@aepyornis/fastboot.ts"

const client = await FastbootClient.create()

// run commands
await client.unlock()
await client.getVar("product")

// flash CalyxOS
import OpfsBlobStore from "@aepyornis/opfs_blob_store"
const bs = await OpfsBlobStore.create()
const hash = "a4434edb21e5e12a00ab9949f48f06c48169adcaeb4dce644857e1528b275274"
const url = "https://release.calyxinstitute.org/lynx-factory-25605200.zip"
await bs.fetch(hash, url)
const file = await bs.get(hash)

const instructions = `
fastboot --set-active=other reboot-bootloader
sleep 5
fastboot flash --slot=other bootloader bootloader-lynx-lynx-15.2-12878710.img
fastboot --set-active=other reboot-bootloader
sleep 5
fastboot flash --slot=other radio radio-lynx-g5300q-241205-250127-B-12973597.img
fastboot --set-active=other reboot-bootloader
sleep 5
fastboot flash --slot=other radio radio-lynx-g5300q-241205-250127-B-12973597.img
fastboot --set-active=other reboot-bootloader
sleep 5
fastboot erase avb_custom_key
fastboot flash avb_custom_key avb_custom_key.img
fastboot --skip-reboot -w update image-lynx-bp1a.250305.019.zip
fastboot reboot-bootloader
`

const client = await FastbootClient.create()
const deviceFlasher = new FastbootFlasher()
await deviceFlasher.run(instructions)
```
