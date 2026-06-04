<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mt-n4">
      <h1 class="pb-4 mt-0">Installation complete</h1>
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

<script setup>
import { onMounted } from "vue"
import { store } from "../store.js"
import AboutCalyxOS from "@/components/AboutCalyxOS.vue"

const release = store.release()

onMounted(() => {
  store.client.reboot()
})
</script>
