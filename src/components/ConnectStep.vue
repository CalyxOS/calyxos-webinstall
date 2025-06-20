<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mb-10">
      <h6 class="text-h6 mb-2">Connect your device</h6>
      <div class="text-body-1 mb-4">
        <p>
          Put your device into bootloader mode by restarting it and holding the
          <strong>volume down</strong> button until you see a
          <span class="text-red-darken-2">red</span> warning sign or
          <span class="text-green-darken-2">green</span>
          Android robot.
        </p>
        <p class="mt-1">
          Once your device is in bootloader mode, plug it into the computer or device you’re
          installing from.
        </p>
        <p class="mt-1">
          Make sure you use a <strong>high-quality</strong> USB cable, as many cables will cause
          issues. Avoid USB hubs if possible. Your USB cable needs to be able to copy files.
          Charging-only cables won’t work.
        </p>
      </div>

      <v-btn
        :color="connected() ? 'null' : 'primary'"
        @click="connect"
        :disabled="connecting || connected()"
        >Connect</v-btn
      >
    </div>

    <div class="mb-10" v-if="connected()">
      <v-alert>
        <v-icon color="green darken-3">mdi-check</v-icon>
        <span class="text-body-1 green--text text--darken-3">
          Connected to {{ store.product }}
        </span>
      </v-alert>

      <v-alert v-if="!store.installable()" class="mt-4" title="Device Not Supported" type="tonal">
        <div v-if="store.cliInstallOnly()">
          <p>
            We're sorry, your device cannot be installed through the web installer.<br />
            Please visit
            <a :href="`https://calyxos.org/install/devices/${store.product}/`"
              >https://calyxos.org/install/devices/{{ store.product }}</a
            >
            for instructions on how to use the command-line device flasher.
          </p>
        </div>
        <div v-else>
          <p>
            We're sorry, your device is not supported by CalyxOS.<br />
            Please Visit <a href="https://calyxos.org/install/">calyxos.org/install</a> for a list
            of supported devices.
          </p>
        </div>
      </v-alert>
    </div>

    <div class="d-flex justify-space-between flex-row-reverse">
      <v-btn color="primary" @click="store.nextStep" :disabled="!mayContinue()"
        >Next <v-icon dark right>mdi-arrow-right</v-icon></v-btn
      >
      <v-btn text @click="store.prevStep">Back</v-btn>
    </div>
  </v-container>
</template>

<script>
import { store } from "../store.js"

export default {
  name: "ConnectStep",

  components: {},

  data() {
    return {
      store,
      connecting: false,
    }
  },

  methods: {
    async connect() {
      try {
        this.connecting = true
        await store.createClient()
      } finally {
        this.connecting = false
      }
    },

    connected() {
      return store.client != null && store.product != null && store.client.fd.device.opened
    },

    mayContinue() {
      return this.connected() && store.installable()
    },
  },
}
</script>
