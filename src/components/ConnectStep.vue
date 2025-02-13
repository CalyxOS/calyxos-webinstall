<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mb-10 mt-n4">
      <h6 class="text-h6 pb-4">Connect your device</h6>

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
        :color="$root.$data.product === null ? 'primary' : null"
        @click="connect"
        :disabled="connecting"
        >Connect</v-btn
      >
    </div>

    <div class="mb-4 mt-n4" v-if="$root.$data.product && !connecting && !installable()">
      <v-alert density="compact" title="Device Not Supported" type="tonal">
        <div v-if="cliInstallOnly()">
          <p>
            We're sorry, your device cannot be installed through the web installer.<br />
            Please visit
            <a :href="`https://calyxos.org/install/devices/${this.$root.$data.product}/`"
              >https://calyxos.org/install/devices/{{ this.$root.$data.product }}</a
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

    <div class="mb-4">
      <connect-banner
        :device="device"
        :connecting="connecting"
        :error="error"
        :name="getDeviceName()"
      />
    </div>

    <div class="d-flex justify-space-between flex-row-reverse">
      <v-btn
        color="primary"
        @click="emit('nextStep')"
        :disabled="$root.$data.product === null || !installable()"
        >Next <v-icon dark right>mdi-arrow-right</v-icon></v-btn
      >
      <v-btn text @click="emit('prevStep')">Back</v-btn>
    </div>
  </v-container>
</template>

<script>
import ConnectBanner from "./ConnectBanner.vue"

export default {
  name: "ConnectStep",

  components: {
    ConnectBanner,
  },

  data: () => ({
    connecting: false,
    error: null,
    firstConnect: true,
  }),

  inject: ["emitError", "emit", "saEvent"],

  methods: {
    async errorRetry() {
      await this.connect()
    },

    async connect() {
      this.connecting = true

      try {
        await this.device.connect()
        this.$root.$data.product = await this.device.getVariable("product")
        this.error = null

        if (this.firstConnect) {
          this.firstConnect = false
          if (this.installable()) {
            this.emit("nextStep")
          }
        }

        this.saEvent(`device_connect__${this.$root.$data.product}`)
      } catch (e) {
        let [handled, message] = this.emitError(e)
        this.error = message
        if (!handled) {
          throw e
        }
      } finally {
        this.connecting = false
      }
    },

    getDeviceName() {
      let product = this.$root.$data.product
      if (!product) {
        return ""
      }
      let release = this.$root.$data.releaseIndex[product]
      if (release && release.name) {
        return release.name
      } else {
        return product
      }
    },

    installable() {
      return (
        this.$root.$data.product &&
        this.$root.$data.releaseIndex[this.$root.$data.product] &&
        this.$root.$data.releaseIndex[this.$root.$data.product].web_install
      )
    },

    cliInstallOnly() {
      return (
        this.$root.$data.product &&
        this.$root.$data.releaseIndex[this.$root.$data.product] &&
        !this.$root.$data.releaseIndex[this.$root.$data.product].web_install
      )
    },
  },

  props: ["device", "active"],

  watch: {
    active: {
      handler(newState) {
        if (newState) {
          this.saEvent("step_connect")
        }
      },
      immediate: true,
    },
  },
}
</script>
