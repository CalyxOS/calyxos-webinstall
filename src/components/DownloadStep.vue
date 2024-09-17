<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="d-flex">
      <v-btn variant="plain" @click="go('download')" :color="substep == 'download' ? 'primary' : 'normal'" :disabled="running">Download</v-btn>
      <v-icon icon="mdi-chevron-right"></v-icon>
      <v-btn variant="plain" @click="go('shasum')" :color="substep === 'shasum' ? 'primary' : 'normal'" :disabled="running || downloadProgress !== 100">Check</v-btn>
    </div>

    <div v-if="error" class="d-flex flex-wrap justify-space-around">
      <v-banner single-line outlined rounded class="mt-8">
        <v-icon slot="icon" color="red darken-3">mdi-close</v-icon>
        <div class="my-4">
          <span class="text-body-1 red--text text--darken-3">{{ error }}</span>
        </div>
      </v-banner>
    </div>

    <div class="d-flex flex-wrap justify-space-around">
      <p class="mt-4 text-h6 font-weight-regular">
        {{ $root.$data.OS_NAME }}: <span class="font-weight-bold">{{ release.version }}</span>
        <v-btn variant="tonal" @click="go('download')" :disabled="running" class="ml-4">
          Start
        </v-btn>
      </p>
    </div>

    <div class="d-flex flex-wrap justify-space-around">
      <div v-if="substep === 'download'">
        <v-banner v-if="running" icon="mdi-download" rounded class="mt-8 pt-1">
          <v-banner-text class="text-body-1">Downloading…</v-banner-text>
        </v-banner>

        <v-progress-linear v-if="downloadProgress !== null" class="my-3" stream :model-value="downloadProgress" buffer-value="0">
        </v-progress-linear>

        <v-banner v-if="!error && downloadProgress === 100" single-line outlined rounded>
          <v-icon slot="icon" color="green darken-3">mdi-check</v-icon>
          <span class="text-body-1 green--text text--darken-3">
            Downloaded {{ $root.$data.OS_NAME }}
	  </span>
        </v-banner>
      </div>

      <div v-else-if="substep === 'shasum'">
        <v-banner v-if="running" icon="mdi-microscope" rounded  class="mt-8 pt-1" >
          <v-banner-text class="text-body-1">Checking…</v-banner-text>
          <v-progress-circular v-if="running" :size="20" :width="7" indeterminate>
          </v-progress-circular>
        </v-banner>

        <v-banner v-if="!error && shasumProgress === 100" single-line outlined rounded>
          <v-icon slot="icon" color="green darken-3">mdi-check</v-icon>
          <span class="text-body-1 green--text text--darken-3">
            Match {{ $root.$data.OS_NAME }} {{ releaseName() }}
	  </span>
        </v-banner>
      </div>

      <div v-else-if="substep === 'minisign'">
      </div>
    </div>

    <div class="d-flex justify-space-between flex-row-reverse mt-4">
      <v-btn color="primary" @click="emit('nextStep')" :disabled="running || Boolean(error) || shasumProgress !== 100">
        Next<v-icon dark right>mdi-arrow-right</v-icon>
      </v-btn>
      <v-btn text @click="emit('prevStep')">Back</v-btn>
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
import { nextTick } from 'vue'
import OpfsBlobStore from 'opfs_blob_store'

export default {
  name: "DownloadStep",

  props: ["device", "active", "release"],

  data: () => ({
    running: false,
    substep: 'download',
    downloadProgress: null,
    shasumProgress: null,
    error: null
  }),

  methods: {
    releaseName() {
      return `${this.release.codename}-${this.release.variant}-${this.release.version}\n${this.release.sha256}`
    },

    async go(substep) {
      switch (substep) {
      case 'download':
        const bs = await OpfsBlobStore.create()
        let inStorage = await bs.has(this.release.sha256)

        // if already downloaded this session, ask to re-download
        if (this.downloadProgress === 100) {
          if (confirm("Download again?")) {
            this.shasumProgress = null
            if (inStorage) {
              await bs.delete(this.release.sha256)
              inStorage = false
            }
          } else {
            if (this.shasumProgress === 100) {
              return Promise.resolve(true)
            }
          }
        }
        // file exists, move to verify
        if (inStorage) {
          this.downloadProgress = 100
          await this.go('shasum')
        } else {
          this.substep = 'download'
          await this.download()
          await (new Promise(resolve => setTimeout(resolve, 1000))) // dramatic pause
          await this.go('shasum')
        }
        break;
      case 'shasum':
        this.substep = 'shasum'
        if (this.shasumProgress === 100) {
          if (confirm("Check again?")) {
            return this.shasum()
          }
        } else {
          return this.shasum()
        }

        break;
      case 'minisign':
        break;
      default:
        throw new Error(`unknown substep: ${substep}`)
      }
    },

    async download() {
      try {
        this.saEvent(`download_${this.$root.$data.product}_${this.release.version}_${this.release.variant}_${this.release.sha256}`)
        this.running = true
        this.downloadProgress = 0
        const bs = await OpfsBlobStore.create()
        await bs.fetch(this.release.sha256, this.release.url, (i) => this.downloadProgress = (i * 100))
        this.error = null
      }
      catch (e) {
        this.downloadProgress = null
        let [handled, message] = this.emitError(e)
        this.error = message
        if (!handled) {
          throw e
        }
      } finally {
        this.running = false
      }
    },

    async shasum() {
      try {
        this.saEvent(`verify_${this.$root.$data.product}_${this.release.version}_${this.release.variant}_${this.release.sha256}`)
        this.running = true
        this.shasumProgress = 0
        await nextTick()
        const bs = await OpfsBlobStore.create()
        await bs.verify(this.release.sha256, (i) => this.shasumProgress = (i * 100))
      } catch (e) {
        this.shasumProgress = null
        let [handled, message] = this.emitError(e)
        this.error = message
        if (!handled) {
          throw e
        }
      } finally {
        this.running = false
      }
    },

    async minisign() {
      throw new Error("Not Yet Implemented")
    }
  },

  inject: ['emit', 'emitError', 'saEvent'],

  async mounted() {
    await this.go('download')
  }

}
</script>
