<template>
  <v-app full-height id="inspire">
    <v-main class="grey lighten-3">
      <v-container fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="2"></v-col>

          <v-col cols="12" sm="8" class="d-flex flex-row justify-center">
            <v-sheet
              :min-height="$vuetify.display.mobile ? '100vh' : '75vh'"
              width="50rem"
              :rounded="$vuetify.display.mobile ? null : 'lg'"
              :elevation="$vuetify.display.mobile ? 0 : 4"
              class="d-flex flex-column"
            >
              <Installer />
            </v-sheet>
          </v-col>

          <v-col cols="12" sm="2"></v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
.v-stepper {
  box-shadow: none !important;
  border-radius: 8px !important;
}
.v-stepper__header {
  box-shadow: none !important;
  border-bottom: thin solid rgba(0, 0, 0, 0.12);
}
.v-stepper__wrapper {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
</style>

<script>
import { h } from "vue"
import Config from "@/config"
import Installer from "@/components/Installer.vue"

import { store } from "./store.js"

export default {
  name: "App",
  components: {
    Installer,
  },

  render: () => h(this),
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  window.$store = store
}
</script>
