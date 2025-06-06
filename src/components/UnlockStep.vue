<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mt-n4">
      <h6 class="text-h6 pb-4">Unlock your bootloader</h6>

      <div class="text-body-1">
        <p>
          In order to install <em>{{ $root.$data.OS_NAME }}</em
          >, you need to unlock your device’s bootloader.
        </p>
        <p>If this is your first time or you haven’t already turned on OEM unlocking:</p>
        <ol class="ml-4 mb-8">
          <li>Restart back to Android</li>
          <li>Go to Settings → “About phone” and scroll to the bottom</li>
          <li>Tap “Build number” repeatedly until developer options is unlocked</li>
          <li>Go to Settings → System → Advanced → “Developer options”</li>
          <li>Turn on “OEM unlocking”</li>
          <li>Restart back to the bootloader</li>
        </ol>
      </div>

      <v-btn color="primary" @click="unlock" :disabled="unlocking || unlocked">Unlock</v-btn>
    </div>

    <div class="mb-4">
      <v-banner single-line outlined rounded class="mt-4" v-if="unlocked">
        <v-icon color="green darken-3">mdi-check</v-icon>
        <span class="text-body-1 green--text text--darken-3">Bootloader unlocked</span>
      </v-banner>
      <v-banner single-line outlined rounded class="mt-4" v-else-if="unlocking">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <span class="text-body-1"
          >Unlocking bootloader… Confirm using the volume and power buttons.</span
        >
      </v-banner>
      <v-banner single-line outlined rounded class="mt-4" v-else-if="error">
        <v-icon color="red darken-3">mdi-close</v-icon>
        <span class="text-body-1 red--text text--darken-3">{{ error }}</span>
      </v-banner>
    </div>

    <div class="d-flex justify-space-between flex-row-reverse">
      <v-btn color="primary" @click="emit('nextStep')" :disabled="!unlocked"
        >Next <v-icon dark right>mdi-arrow-right</v-icon></v-btn
      >
      <v-btn text @click="emit('prevStep')">Back</v-btn>
    </div>

    <v-dialog v-model="oemUnlockDialog" width="500" persistent>
      <v-card>
        <v-card-title class="headline"> Enable OEM unlocking </v-card-title>

        <v-card-text>
          <p>
            For security reasons, bootloader unlock isn’t allowed by default. Enable OEM unlocking
            to allow it:
          </p>

          <ol class="ml-4 mb-4">
            <li>Restart back to Android</li>
            <li>Go to Settings → “About phone” and scroll to the bottom</li>
            <li>Tap “Build number” repeatedly until developer options is unlocked</li>
            <li>Go to Settings → System → Advanced → “Developer options”</li>
            <li>Turn on “OEM unlocking”</li>
            <li>Restart back to the bootloader</li>
          </ol>

          <p>Once you’ve enabled OEM unlocking, try unlocking the bootloader again.</p>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="retryOemUnlock"> Retry </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { FastbootError } from "fastboot"

export default {
  name: "UnlockStep",

  props: ["device", "curStep", "stepNum"],

  data: () => ({
    unlocking: false,
    unlocked: undefined,
    initialUnlocked: undefined,
    firstUnlock: true,
    error: null,
    oemUnlockDialog: false,
  }),

  inject: ["emit", "emitError", "saEvent"],

  methods: {
    async retryOemUnlock() {
      this.oemUnlockDialog = false
      return this.unlock()
    },

    async unlock() {
      this.saEvent(`unlock_bootloader__${this.$root.$data.product}`)
      this.unlocking = true

      try {
        if (!this.device.isConnected) {
          await this.device.connect()
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        // Unlocking can't be done in fastbootd
        if ((await this.device.getVariable("is-userspace")) === "yes") {
          await this.device.reboot("bootloader", true, () => {
            this.emit("requestDeviceReconnect")
          })
        }

        if ((await this.device.getVariable("unlocked")) === "no") {
          await this.device.runCommand("flashing unlock")
          await new Promise((resolve) => setTimeout(resolve, 15000))
          return this.unlock()
        } else {
          this.unlocked = true
        }
      } catch (e) {
        if (e instanceof FastbootError && e.status === "FAIL") {
          if (e.message.includes("already")) {
            this.error = e.message
            return
          } else if (e.message.includes("canceled")) {
            this.error = "Unlock request was canceled"
            return
          } else if (e.message.includes("not allowed")) {
            this.error = "OEM unlocking is not enabled"
            this.oemUnlockDialog = true
            return
          }
        }

        let [handled, message] = this.emitError(e)
        this.error = message
        if (!handled) {
          throw e
        }
      } finally {
        this.unlocking = false
      }
    },
  },
  async mounted() {
    return this.unlock()
  },
}
</script>
