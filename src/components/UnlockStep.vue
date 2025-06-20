<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mt-n4">
      <h6 class="text-h6 pb-4">Unlock your bootloader</h6>

      <div class="text-body-1">
        <p>In order to install <em>CalyxOS</em>, you need to unlock your device’s bootloader.</p>
        <p>If this is your first time or you haven’t already turned on OEM unlocking:</p>
        <ol class="ml-4 mb-8">
          <li>Restart back to Android</li>
          <li>Go to Settings → “About phone” and scroll to the bottom</li>
          <li>Tap “Build number” repeatedly until developer options is unlocked</li>
          <li>Go to Settings → System → Advanced → “Developer options”</li>
          <li>Turn on “OEM unlocking”</li>
          <li>Restart back to the bootloader</li>
          <li>Refresh this page and start again</li>
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
      <v-btn color="primary" @click="store.nextStep" :disabled="!unlocked">
        Next
        <v-icon dark right>mdi-arrow-right</v-icon></v-btn
      >
      <v-btn text @click="store.prevStep">Back</v-btn>
    </div>
  </v-container>
</template>

<script>
import { store } from "../store.js"

export default {
  name: "UnlockStep",

  data() {
    return {
      store,
      locking: false,
      unlocked: false,
      error: null,
    }
  },
  methods: {
    async unlock() {
      try {
        this.locking = true
        this.error = null
        await store.client.unlock()
        this.unlocked = true
      } catch (e) {
        console.debug(e)
        this.error = e.message
      } finally {
        this.locking = false
      }
    },
  },
}
</script>
