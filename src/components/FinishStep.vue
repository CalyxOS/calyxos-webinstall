<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mt-n4">
      <h6 class="text-h6 pb-4">Installation complete</h6>
      <p class="text-body-1">
        Congratulations! Your
        {{ release.name ? release.name : release.product }} is now running CalyxOS
        {{ release.version }} ({{ release.date }}).
      </p>
    </div>

    <AboutCalyxOS />

    <div class="d-flex justify-space-between mt-4">
      <v-btn text @click="store.prevStep">Back</v-btn>
    </div>
  </v-container>
</template>

<style>
.theme--light.v-sheet--outlined {
  border-width: 2px;
}

.theme--light.v-sheet--outlined.v-card--p-highlight {
  border: 2px solid #007cfa !important;
}
</style>

<script>
import { store } from "../store.js"
import AboutCalyxOS from "@/components/AboutCalyxOS.vue"

export default {
  name: "FinishStep",

  components: { AboutCalyxOS },

  data() {
    return {
      store,
      release: store.release(),
    }
  },

  async mounted() {
    store.client.reboot()
  },
}
</script>
