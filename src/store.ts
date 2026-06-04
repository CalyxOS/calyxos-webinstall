import { reactive } from "vue"
import { FastbootClient } from "@aepyornis/fastboot.ts"
import OpfsBlobStore from "opfs_blob_store"

import RELEASE_INDEX_JSON from "@/assets/releases.json"

export interface Release {
  name: string
  codename: string
  date: string
  version: string
  variant: string
  url: string
  sha256: string
  web_install: boolean
}

const RELEASE_INDEX = RELEASE_INDEX_JSON as Record<string, Release>

interface Store {
  curStep: number
  client: FastbootClient | null
  product: string | null
  createClient(): Promise<void>
  release(): Release
  installable(): boolean
  cliInstallOnly(): boolean
  nextStep(): void
  prevStep(): void
  getImage(): Promise<File>
}

export const store: Store = reactive({
  curStep: 1,
  client: null as FastbootClient | null,
  product: null as string | null,

  async createClient(): Promise<void> {
    if (store.client) {
      throw new Error("FastbootClient already connected")
    }
    store.client = await FastbootClient.create()
    store.product = (await store.client.getVarCache("product")) ?? null
  },

  release(): Release {
    if (store.product === null) {
      throw new Error("store.product is null. Is the device connected?")
    }
    const release = RELEASE_INDEX[store.product]
    if (!release) {
      throw new Error(`No release found for product: ${store.product}`)
    }
    return release
  },

  installable(): boolean {
    return store.product != null && RELEASE_INDEX[store.product]?.web_install === true
  },

  cliInstallOnly(): boolean {
    return store.product != null && RELEASE_INDEX[store.product]?.web_install === false
  },

  nextStep(): void {
    store.curStep++
  },

  prevStep(): void {
    store.curStep--
  },

  async getImage(): Promise<File> {
    return (await OpfsBlobStore.create()).get(store.release().sha256)
  },
})
