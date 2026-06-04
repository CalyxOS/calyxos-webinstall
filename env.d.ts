/// <reference types="vite/client" />
/// <reference types="w3c-web-usb" />

import type { FastbootDevice, FastbootClient, FastbootFlasher } from "@aepyornis/fastboot.ts"
import type OpfsBlobStore from "opfs_blob_store"
import type { store } from "@/store"

interface ImportMetaEnv {
  readonly VITE_APP_OS_NAME: string
}

declare global {
  interface Window {
    $app?: unknown
    $store?: typeof store
    OpfsBlobStore?: typeof OpfsBlobStore
    FastbootDevice?: typeof FastbootDevice
    FastbootClient?: typeof FastbootClient
    FastbootFlasher?: typeof FastbootFlasher
  }
}
