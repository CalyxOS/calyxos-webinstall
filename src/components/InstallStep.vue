<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mt-n4 flex-grow-1" v-if="error">
      <p class="mt-2"><strong>⚠️ Something went wrong</strong>Try starting over</p>
    </div>

    <div class="mt-n4 flex-grow-1" v-else>
      <h1 class="pb-4 mt-0">Install CalyxOS</h1>

      <div class="text-body-1">
        <p>
          This will install <strong>CalyxOS ({{ store.release().version }})</strong> on your
          <strong>{{ store.release().name }}</strong>.
        </p>
        <p>
          Because you’re doing a clean install, <strong>all data on your device will be permanently lost.</strong>
        </p>
        <p class="mt-2">
	  <strong>⚠️ Don't touch, unplug, or press any buttons</strong> on the device you are flashing <i>during this process</i> or else the installation may fail.
        </p>

        <p class="mt-2">
	  Your device will restart several times while the installation proceeds. After a restart, you may see a button on this page to reconnect your device. <strong>Click the button and select the device in the pop-up window to reconnect.</strong>
        </p>

        <p class="mt-2">This may take 10-15 minutes.</p>
      </div>

      <div>
	<div ref="logViewer" class="log-viewer pa-2 bg-surface text-high-emphasis">
	  <div v-for="(line, i) in log" :key="i" class="log-line">{{ line }}</div>
	  <div ref="logBottom"></div>
	</div>
      </div>

      <v-btn color="primary" :disabled="installing" @click="install()" class="mt-2">
        Install
      </v-btn>
      <v-btn color="yellow-lighten-2" v-if="askForReconnect" @click="requestDevice()" class="ml-2 mt-2">
        Reconnect
      </v-btn>
    </div>

    <div class="pb-8 mt-2">
      <v-banner single-line outlined rounded v-if="installProgress === 100">
        <v-icon color="green darken-3">mdi-check</v-icon>
        <div class="my-4">
          <span class="text-body-1 green--text text--darken-3">
            Installed CalyxOS ({{ store.release().version }}) released on
            {{ store.release().date }}.
          </span>
        </div>
      </v-banner>
      <v-banner rounded class="mt-8 pt-1" v-else-if="installProgress !== null">
        <v-banner-text class="text-body-1">
          {{ installStatus }}
        </v-banner-text>
      </v-banner>

      <v-banner single-line outlined rounded class="mt-8" v-else-if="error">
        <v-icon color="red darken-3">mdi-close</v-icon>
        <div class="my-4">
          <span class="text-body-1 red--text text--darken-3">{{ error.message }}</span>
        </div>
      </v-banner>
    </div>

    <div class="d-flex justify-space-between flex-row-reverse">
      <v-btn
        color="primary"
        @click="store.nextStep"
        :disabled="installing || this.installProgress !== 100"
      >Next <v-icon dark right>mdi-arrow-right</v-icon></v-btn
						       >
      <v-btn text @click="store.prevStep" :disabled="installing">Back</v-btn>
    </div>
  </v-container>
</template>

<style scoped>
 .log-viewer {
   height: calc(10 * 1.5em);
   overflow-y: auto;
   font-family: monospace;
 }
 .log-line {
   white-space: pre-wrap;
 }
</style>

<script>
 import { store } from "../store.js"
 import { FastbootFlasher, FastbootClient } from "@aepyornis/fastboot.ts"

 export default {
   name: "InstallStep",

   data() {
     return {
       store,
       installProgress: null,
       installStatus: "",
       installing: false,
       error: null,
       askForReconnect: false,
       reconnectResolve: null,
       log: []
     }
   },

   mounted() {
     this._observer = new MutationObserver(() => {
       this.$refs.logBottom.scrollIntoView()
     })

     this._observer.observe(this.$refs.logViewer, { childList: true })
   },

   beforeUnmount() {
    this._observer?.disconnect()
  },

   methods: {
     async install() {
       this.installed = false
       this.installing = true
       this.error = null
       this.installProgress = 0
       this.installStatus = "Installing..."
       this.askForReconnect = false
       this.log = []

       const oLogger = store.client.logger
       store.client.logger = this.createLogger()

       store.client.reconnectUserAction = () => {
         return this.requestDeviceAndReconnect()
       }

       try {
         const t0 = performance.now()
         const ff = new FastbootFlasher(store.client, await store.getImage())
         await ff.runFlashAll()
         const t1 = performance.now()
         this.installStatus = `Finished in ${(t1 - t0) / 1000} seconds.`
         this.installProgress = 100
       } catch (e) {
         this.error = e
         throw e
       } finally {
         this.installing = false
	 store.client.logger = oLogger
       }
     },

     async requestDeviceAndReconnect() {
       this.askForReconnect = true
       return new Promise((resolve) => {
         this.reconnectResolve = resolve
       })
     },

     async requestDevice() {
       try {
         const device = await FastbootClient.requestUsbDevice()
         if (device) {
           this.askForReconnect = false
           this.reconnectResolve?.()
           this.reconnectResolve = null
         }
       } catch (e) {
         this.error = e
         throw e
       }
     },

     createLogger() {
       const thisLog = this.log
       return {
	 log(message) {
	   thisLog.push(message)
	   window.console.log(message)
	 }
       }
     },

   }
 }
</script>
