<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mt-n4">
      <h6 class="text-h6 pb-4">Lock the bootloader on your phone</h6>

      <div class="text-body-1 mb-4">
        <p>Lock the bootloader using the volume buttons on your phone</p>
      </div>

      <v-btn color="primary" @click="lock" v-show ="!locked && !locking" :disabled="locking">Lock</v-btn>
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
      <v-btn color="primary" @click="store.nextStep" :disabled="!locked"
        >Finish <v-icon dark right>mdi-arrow-right</v-icon></v-btn
      >
      <v-btn text @click="store.prevStep">Back</v-btn>
    </div>
  </v-container>
</template>

<script>
import { store } from "../store.js"

export default {
  name: "LockStep",

  data() {
    return {
      store,
      locking: false,
      locked: null,
      error: null,
    }
  },

  methods: {
    async lock() {
      try {
        this.locking = true
        this.error = null
        await store.client.lock()
        this.locked = true
      } catch (e) {
        console.debug(e)
        this.error = e.message
      } finally {
        this.locking = false
      }
    },
  },

  async mounted() {
    await this.lock()
  },
}
</script>
