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
        {{ $root.$data.OS_NAME }}: <span class="font-weight-bold">{{ release.version }}</span>
        <v-btn variant="tonal" @click="run()" :disabled="running" class="ml-4"> Start </v-btn>
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
          <span class="text-body-1 green--text text--darken-3">
            Downloaded {{ $root.$data.OS_NAME }}
          </span>
        </v-banner>
      </div>
    </div>

    <div class="d-flex justify-space-between flex-row-reverse mt-4">
      <v-btn
        color="primary"
        @click="emit('nextStep')"
        :disabled="running || Boolean(error) || progress !== 100"
      >
        Next<v-icon dark right>mdi-arrow-right</v-icon>
      </v-btn>
      <v-btn text @click="emit('prevStep')" :disabled="running">Back</v-btn>
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

<script>
import OpfsBlobStore from "opfs_blob_store"

export default {
  name: "DownloadStep",

  props: ["device", "active", "release"],

  data: () => ({
    running: false,
    progress: null,
    error: null,
  }),

  methods: {
    releaseName() {
      return `${this.release.codename}-${this.release.variant}-${this.release.version}\n${this.release.sha256}`
    },

    async run() {
      try {
        this.error = null
        const bs = await OpfsBlobStore.create()
        let inStorage = await bs.has(this.release.sha256)

        // if already downloaded this session, ask to re-download
        if (inStorage && this.progress === 100) {
          if (confirm("Download again?")) {
            await bs.delete(this.release.sha256)
            inStorage = false
          } else {
            return Promise.resolve(true)
          }
        }

        if (inStorage) {
          // if file size is too small we can re-download without wasting time checking
          const file = await bs.get(this.release.sha256)
          if (file.size < 200000000) {
            console.debug(
              `The file for ${this.release.sha256} is too small: ${file.size}. Downloading again.`,
            )
            await bs.delete(this.release.sha256)
            await this.download()
          } else {
            try {
              await this.shasum()
            } catch (e) {
              console.debug(
                `${this.release.sha256} check failed: ${e.message}. Downloading again.`,
              )
              await bs.delete(this.release.sha256)
              await this.download()
            }
          }
        } else {
          await this.download()
        }
      } catch (e) {
        let [handled, message] = this.emitError(e)
        this.error = message
        if (!handled) {
          throw e
        }
      }
    },

    async download() {
      this.saEvent(
        `download_${this.$root.$data.product}_${this.release.version}_${this.release.variant}_${this.release.sha256}`,
      )

      this.progress = 0

      return new Promise((resolve, reject) => {
        const worker = new Worker(new URL("../workers/fetch_worker.js", import.meta.url), {
          type: "module",
        })

        worker.addEventListener("message", async (event) => {
          switch (event.data.type) {
            case "progress":
              this.progress = event.data.i * 100
              break
            case "error":
              this.running = false
              reject(event.data.e)
              break
            case "complete":
              this.running = false
              resolve(true)
              break
            default:
              throw new Error(`unknown type: ${event.data.type}`)
          }
        })

        this.running = true
        worker.postMessage({ type: "start", sha256: this.release.sha256, url: this.release.url })
      })
    },

    async shasum() {
      this.saEvent(
        `verify_${this.$root.$data.product}_${this.release.version}_${this.release.variant}_${this.release.sha256}`,
      )

      this.progress = 0

      return new Promise((resolve, reject) => {
        const worker = new Worker(new URL("../workers/shasum_worker.js", import.meta.url), {
          type: "module",
        })

        worker.addEventListener("message", async (event) => {
          switch (event.data.type) {
            case "progress":
              this.progress = event.data.i * 100
              break
            case "error":
              this.running = false
              reject(event.data.e)
              break
            case "complete":
              this.running = false
              resolve(true)
              break
            default:
              throw new Error(`unknown type: ${event.data.type}`)
          }
        })

        this.running = true
        worker.postMessage({ type: "start", sha256: this.release.sha256 })
      })
    },
  },

  inject: ["emit", "emitError", "saEvent"],

  async mounted() {
    await this.run()
  },
}
</script>
