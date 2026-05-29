<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mt-n4 flex-grow-1" v-if="error">
      <p class="mt-2"><strong>⚠️ Something went wrong</strong>Try starting over</p>
    </div>

    <div class="mt-n4 flex-grow-1" v-else>
      <h6 class="text-h6 pb-4">Install CalyxOS</h6>

      <div class="text-body-1">
        <p>
          This will install <strong>CalyxOS ({{ store.release().version }})</strong> on your
          <strong>{{ store.release().name }}</strong
          >. Your phone will restart several times.
        </p>
        <p>
          Because you’re doing a clean install,
          <strong class="red--text text--darken-3">
            all data on your device will be permanently lost.
          </strong>
        </p>
        <p class="mt-2">
          <strong>⚠️ Don’t touch, unplug, or press any buttons</strong> on your device during
          <i>this process</i> or else the installation may fail. Watch the progress bar on this
          page to check the status.
        </p>

        <p class="mt-2">
          After a restart, you may be asked to
          <strong>click a button so that your browser may prompt you</strong> to choose a device
          and reconnect.
        </p>

        <p class="mt-2">This may take 10-15 minutes.</p>
      </div>

      <v-btn color="primary" :disabled="installProgress !== null" @click="install()" class="mt-2">
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
      <v-progress-linear
        class="my-3"
        buffer-value="0"
        v-model="installProgress"
        stream
        v-if="installProgress !== null"
      ></v-progress-linear>

      <v-banner single-line outlined rounded class="mt-8" v-else-if="error">
        <v-icon color="red darken-3">mdi-close</v-icon>
        <div class="my-4">
          <span class="text-body-1 red--text text--darken-3">{{ error.message }}</span>
        </div>
      </v-banner>

      <v-banner single-line outlined rounded v-else> </v-banner>
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
    }
  },

  methods: {
    async install() {
      this.installed = false
      this.installing = true
      this.error = null
      this.installProgress = 0
      this.installStatus = "Installing..."
      this.askForReconnect = false

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
  },
}
</script>
