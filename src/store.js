import { reactive } from "vue"
import { FastbootClient } from "@aepyornis/fastboot.ts"
import OpfsBlobStore from "@aepyornis/opfs_blob_store"

import RELEASE_INDEX from "/src/releases.json"

export const store = reactive({
  curStep: 1,
  client: null,
  product: null,

  async createClient() {
    if (store.client) {
      throw new Error("FastbootClient already connected")
    }
    store.client = await FastbootClient.create()
    store.product = await store.client.getVar("product")
  },

  release() {
    if (store.product === null) {
      throw new Error("store.product is null. Is the device connected?")
    }
    return RELEASE_INDEX[store.product]
  },

  installable() {
    return (
      store.product != null &&
      RELEASE_INDEX[store.product] &&
      RELEASE_INDEX[store.product].web_install
    )
  },

  cliInstallOnly() {
    return (
      store.product != null &&
      RELEASE_INDEX[store.product] &&
      !RELEASE_INDEX[store.product].web_install
    )
  },

  nextStep() {
    store.curStep++
  },

  prevStep() {
    store.curStep--
  },

  async getImage() {
    return (await OpfsBlobStore.create()).get(RELEASE_INDEX[store.product].sha256)
  },
})
