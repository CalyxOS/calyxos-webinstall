<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mt-n4">
      <h6 class="text-h6 pb-4">Lock the bootloader on your phone</h6>

      <div class="text-body-1 mb-4">
        <p>Lock the bootloader using the volume buttons on your phone</p>
      </div>

      <v-btn color="primary" @click="lock" :disabled="locking || locked">Lock</v-btn>
    </div>

    <div class="mb-4">
      <v-banner single-line outlined rounded class="mt-4" v-if="locked">
        <v-icon color="green darken-3">mdi-check</v-icon>
        <span class="text-body-1 green--text text--darken-3">Bootloader locked</span>
      </v-banner>
      <v-banner single-line outlined rounded class="mt-4" v-else-if="locking">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <span class="text-body-1"
          >Locking bootloader… Confirm using the volume and power buttons.</span
        >
      </v-banner>
      <v-banner single-line outlined rounded class="mt-4" v-else-if="error">
        <v-icon color="red darken-3">mdi-close</v-icon>
        <span class="text-body-1 red--text text--darken-3">{{ error }}</span>
      </v-banner>
    </div>

    <div class="d-flex justify-space-between flex-row-reverse">
      <v-btn color="primary" @click="emit('nextStep')" :disabled="!locked"
        >Finish <v-icon dark right>mdi-arrow-right</v-icon></v-btn
      >
      <v-btn text @click="emit('prevStep')">Back</v-btn>
    </div>
  </v-container>
</template>

<script>
import { FastbootError } from "android-fastboot"

export default {
  name: "LockStep",

  props: ["device", "curStep", "stepNum"],

  data: () => ({
    locking: false,
    locked: null,
    error: null,
  }),

  inject: ["emit", "emitError", "saEvent"],

  methods: {
    async lock() {
      this.saEvent(`lock_bootloader${this.$root.$data.product}`)
      this.locked = null
      this.locking = true
      this.error = null

      try {
        if (!this.device.isConnected) {
          await this.device.connect()
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        // Locking can't be done in fastbootd
        if ((await this.device.getVariable("is-userspace")) === "yes") {
          await this.device.reboot("bootloader", true, () => {
            this.emit("requestDeviceReconnect")
          })
          return this.lock()
        }

        if ((await this.device.getVariable("unlocked")) === "no") {
          this.locked = true
          await this.device.reboot("")
        } else {
          this.locked = false
          try {
            await this.device.runCommand("flashing lock")
            // pause while lock message is on screen
            await new Promise((resolve) => setTimeout(resolve, 15000))
            // until the user confirms on the phone, fastboot cannot connect
            while (!this.device.isConnected) {
              await new Promise((resolve) => setTimeout(resolve, 1000))
            }
            return this.lock()
          } catch (e) {
            if (
              e instanceof FastbootError &&
              e.status === "FAIL" &&
              e.message.includes("already")
            ) {
              //  Try again if already locked
              return this.lock()
            } else {
              throw e
            }
          }
        }
      } catch (e) {
        if (e instanceof DOMException && e.message.includes("A transfer error has occurred")) {
          console.error("Transfer error", e)
        }

        let [handled, message] = this.emitError(e)
        this.error = message
        if (!handled) {
          throw e
        }
      } finally {
        this.locking = false
      }
    },
  },

  async mounted() {
    return this.lock()
  },
}
</script>
