<template>
  <v-banner single-line outlined rounded class="mt-8" v-if="connecting">
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
    <span class="text-body-1">Connecting to device…</span>
  </v-banner>
  <v-banner
    single-line
    outlined
    rounded
    class="mt-8"
    v-else-if="this.device.isConnected && $root.$data.product !== null"
  >
    <v-icon color="green darken-3">mdi-check</v-icon>
    <span class="text-body-1 green--text text--darken-3"> Connected to {{ name }} </span>
  </v-banner>
  <v-banner single-line outlined rounded class="mt-8" v-else-if="error">
    <v-icon color="red darken-3">mdi-close</v-icon>
    <span class="text-body-1 red--text text--darken-3">{{ error }}</span>
  </v-banner>
</template>

<script>
export default {
  name: "ConnectBanner",

  props: ["device", "connecting", "error", "name"],
}
</script>
