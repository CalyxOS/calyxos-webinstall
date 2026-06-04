<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div v-if="error" class="d-flex flex-wrap justify-space-around">
      <v-banner single-line outlined rounded class="mt-8">
        <v-icon color="red darken-3">mdi-close</v-icon>
        <div class="my-4">
          <span class="text-body-1 red--text text--darken-3">{{ error }}</span>
        </div>
      </v-banner>
    </div>

    <div class="d-flex flex-wrap justify-space-around">
      <p class="mt-4 text-h6 font-weight-regular">
        CalyxOS: <span class="font-weight-bold">{{ release.version }}</span>
        <v-btn variant="tonal" @click="run()" :disabled="running" class="ml-4"> Download </v-btn>
      </p>
    </div>

    <div class="d-flex flex-wrap justify-space-around">
      <div>
        <v-banner v-if="running" icon="mdi-download" rounded class="mt-8 pt-1">
          <v-banner-text class="text-body-1">Downloading…</v-banner-text>
        </v-banner>

        <v-progress-linear
          v-if="progress !== null"
          class="my-3"
          stream
          :model-value="progress"
          buffer-value="0"
        >
        </v-progress-linear>

        <v-banner v-if="!error && progress === 100" single-line outlined rounded>
          <v-icon color="green darken-3">mdi-check</v-icon>
          <span class="text-body-1 green--text text--darken-3">Downloaded CalyxOS</span>
        </v-banner>
      </div>
    </div>

    <div class="d-flex justify-space-between flex-row-reverse mt-4">
      <v-btn
        color="primary"
        @click="store.nextStep"
        :disabled="running || Boolean(error) || progress !== 100"
      >
        Next<v-icon dark right>mdi-arrow-right</v-icon>
      </v-btn>
      <v-btn text @click="store.prevStep" :disabled="running">Back</v-btn>
    </div>
  </v-container>
</template>

<style>
.theme--light.v-sheet--outlined {
  border-width: 2px;
}

.theme--light.v-sheet--outlined.v-card--selected {
  border: 2px solid rgba(0, 0, 0, 0.77) !important;
}
</style>

<script setup>
import { ref } from "vue"
import OpfsBlobStore from "opfs_blob_store"
import { store } from "../store.js"

const release = store.release()
const running = ref(false)
const progress = ref(null)
const error = ref(null)

async function run() {
  const release = store.release()
  error.value = null
  const bs = await OpfsBlobStore.create()
  let inStorage = await bs.has(release.sha256)

  // if already downloaded this session, ask to re-download
  if (inStorage && progress.value === 100) {
    if (confirm("Download again?")) {
      await bs.delete(release.sha256)
      inStorage = false
    } else {
      return Promise.resolve(true)
    }
  }

  if (inStorage) {
    // if file size is too small we can re-download without wasting time checking
    const file = await bs.get(release.sha256)
    if (file.size < 200000000) {
      console.debug(
        `The file for ${release.sha256} is too small: ${file.size}. Downloading again.`,
      )
      await bs.delete(release.sha256)
      await download()
    } else {
      try {
        await shasum()
      } catch (e) {
        console.debug(`${release.sha256} check failed: ${e.message}. Downloading again.`)
        await bs.delete(release.sha256)
        await download()
      }
    }
  } else {
    await download()
  }
}

async function download() {
  const rel = store.release()
  console.log(`download_${rel.codename}_${rel.version}_${rel.variant}_${release.sha256}`)

  progress.value = 0

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../workers/fetch_worker.js", import.meta.url), {
      type: "module",
    })

    worker.addEventListener("message", async (event) => {
      switch (event.data.type) {
        case "progress":
          progress.value = event.data.i * 100
          break
        case "error":
          running.value = false
          reject(event.data.e)
          break
        case "complete":
          running.value = false
          resolve(true)
          break
        default:
          throw new Error(`unknown type: ${event.data.type}`)
      }
    })

    running.value = true
    worker.postMessage({ type: "start", sha256: rel.sha256, url: rel.url })
  })
}

async function shasum() {
  const rel = store.release()
  console.log(`verify_${rel.codename}_${rel.version}_${rel.variant}_${release.sha256}`)

  progress.value = 0

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../workers/shasum_worker.js", import.meta.url), {
      type: "module",
    })

    worker.addEventListener("message", async (event) => {
      switch (event.data.type) {
        case "progress":
          progress.value = event.data.i * 100
          break
        case "error":
          running.value = false
          reject(event.data.e)
          break
        case "complete":
          running.value = false
          resolve(true)
          break
        default:
          throw new Error(`unknown type: ${event.data.type}`)
      }
    })

    running.value = true
    worker.postMessage({ type: "start", sha256: rel.sha256 })
  })
}
</script>
