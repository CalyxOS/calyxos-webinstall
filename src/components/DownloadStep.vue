<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="d-flex">
      <v-btn variant="plain" @click="go('download')" :color="substep == 'download' ? 'primary' : 'normal'" :disabled="running">
        Download
        <v-icon slot="icon" color="green darken-3" v-if="downloadProgress == 100">mdi-check</v-icon>
      </v-btn>
      <v-icon icon="mdi-chevron-right"></v-icon>
      <v-btn variant="plain" :color="substep === 'shasum' ? 'primary' : 'normal'" :disabled="running || downloadProgress !== 100">
        Check
        <v-icon slot="icon" color="green darken-3" v-if="shasumProgress == 100">mdi-check</v-icon>
      </v-btn>
      <v-icon icon="mdi-chevron-right"></v-icon>
      <v-btn variant="plain" :color="substep === 'minisign' ? 'primary' : 'normal'" :disabled="running || downloadProgress !== 100 || shasumProgress !== 100">
        Verify
        <v-icon slot="icon" color="green darken-3" v-if="minisignProgress == 100">mdi-check</v-icon>
      </v-btn>
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
        </v-banner>

        <v-progress-linear v-if="shasumProgress !== null" class="my-3" stream :model-value="shasumProgress" buffer-value="0">
        </v-progress-linear>

        <v-banner v-if="!error && shasumProgress === 100" single-line outlined rounded>
          <v-icon slot="icon" color="green darken-3">mdi-check</v-icon>
          <span class="text-body-1 green--text text--darken-3">
            Matched {{ $root.$data.OS_NAME }} {{ releaseName() }}
	  </span>
        </v-banner>
      </div>

      <div v-else-if="substep === 'minisign'">
        <v-banner v-if="running" icon="mdi-file-check-outline" rounded  class="mt-8 pt-1" >
          <v-banner-text class="text-body-1">Verifying...</v-banner-text>
        </v-banner>

        <v-progress-linear v-if="minisignProgress !== null" class="my-3" stream :model-value="minisignProgress" buffer-value="0">
        </v-progress-linear>

        <v-banner v-if="!error && minisignProgress === 100" single-line outlined rounded>
          <v-icon slot="icon" color="green darken-3">mdi-check</v-icon>
          <span class="text-body-1 green--text text--darken-3">
            Verified {{ $root.$data.OS_NAME }} {{ releaseName() }}
	  </span>
        </v-banner>
      </div>
    </div>

    <div class="d-flex justify-space-between flex-row-reverse mt-4">
      <v-btn color="primary" @click="emit('nextStep')" :disabled="running || Boolean(error) || shasumProgress !== 100 || minisignProgress !== 100">
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
 import OpfsBlobStore from 'opfs_blob_store'
 import MinisignVerify, { InvalidSignatureError } from 'minisign_verify'

 export default {
   name: "DownloadStep",

   props: ["device", "active", "release"],

   data: () => ({
     running: false,
     substep: 'download',
     downloadProgress: null,
     shasumProgress: null,
     minisignProgress: null,
     error: null
   }),

   methods: {
     releaseName() {
       return `${this.release.codename}-${this.release.version}-${this.release.date}`
       // return `${this.release.codename}-${this.release.variant}-${this.release.version}\n${this.release.sha256}`
     },

     async go(substep) {
       try {
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

             if (inStorage) { // file exists, move to verify
               this.downloadProgress = 100
               await this.go('shasum')
             } else {
               this.substep = 'download'
               await this.download()
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
               await this.shasum()
               await this.go('minisign')
             }
             break;
           case 'minisign':
             this.substep = 'minisign'
             await this.minisign()
             return Promise.resolve(true)
             default:
             throw new Error(`unknown substep: ${substep}`)
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
       this.saEvent(`download_${this.$root.$data.product}_${this.release.version}_${this.release.variant}_${this.release.sha256}`)

       return new Promise( (resolve, reject) => {
         const worker = new Worker(new URL("../workers/fetch_worker.js", import.meta.url), { "type": "module" } )

         worker.addEventListener("message", async event => {
           switch (event.data.type) {
             case "progress":
               this.downloadProgress = (event.data.i * 100)
               break;
             case "error":
               this.running = false
               reject(event.data.e)
               break;
             case "complete":
               this.running = false
               resolve(true)
               break;
             default:
               throw new Error(`unknown type: ${e.data.type}`)
           }
         })

         this.running = true
         worker.postMessage({ "type": "start", "sha256": this.release.sha256, "url": this.release.url })
       })
     },

     async shasum() {
       this.saEvent(`shasum_verify_${this.$root.$data.product}_${this.release.version}_${this.release.variant}_${this.release.sha256}`)

       return new Promise( (resolve, reject) => {
         const worker = new Worker(new URL("../workers/shasum_worker.js", import.meta.url), { "type": "module" } )

         worker.addEventListener("message", async event => {
           switch (event.data.type) {
             case "progress":
               this.shasumProgress = (event.data.i * 100)
               break;
             case "error":
               this.running = false
               reject(event.data.e)
               break;
             case "complete":
               this.running = false
               resolve(true)
               break;
             default:
               throw new Error(`unknown type: ${e.data.type}`)
           }
         })

         this.running = true
         this.shasumProgress = 0
         worker.postMessage({ "type": "start", "sha256": this.release.sha256 })
       })
     },

     async minisign() {
       this.saEvent(`minisign_verify_${this.$root.$data.product}_${this.release.version}_${this.release.variant}_${this.release.sha256}`)

       return new Promise( (resolve, reject) => {
         const worker = new Worker(new URL("../workers/minisign_worker.js", import.meta.url), { "type": "module" } )

         worker.addEventListener("message", async event => {
           switch (event.data.type) {
             case "progress":
               this.minisignProgress = (event.data.i * 100) - 1
               break;
             case "error":
               this.running = false
               reject(event.data.e)
               break;
             case "complete":
               this.minisignProgress = 100
               this.running = false
               resolve(true)
               break;
             default:
               throw new Error(`unknown type: ${e.data.type}`)
           }
         })
         this.running = true
         this.minisignProgress = 0
         worker.postMessage({ "type": "start", "url": this.release.url, "sha256": this.release.sha256 })
       })
     }
   },

   inject: ['emit', 'emitError', 'saEvent'],

   async mounted() {
     await this.go('download')
   }

 }
</script>
