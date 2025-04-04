<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mt-n4">
      <h6 class="text-h6 pb-4">Choose an install type</h6>

      <div class="text-body-1">
        <p>
          This installer can help you factory reset or update your
          {{ $root.$data.OS_NAME }} device or switch to {{ $root.$data.OS_NAME }} from another OS.
        </p>
      </div>
    </div>

    <div class="d-flex flex-wrap justify-space-around">
      <v-card
        outlined
        max-width="16rem"
        class="ma-4 d-flex flex-column"
        ripple
        :color="$root.$data.installType === 'clean' ? 'grey lighten-4' : null"
        :class="$root.$data.installType === 'clean' ? 'v-card--selected' : null"
        @click="setType('clean')"
      >
        <v-card-title class="mt-n2">
          <v-icon class="pr-2 py-2" color="rgba(0, 0, 0, 0.87)">mdi-cellphone-erase</v-icon>
          Clean install</v-card-title
        >
        <v-card-text
          >Factory reset or switch to {{ $root.$data.OS_NAME }}.
          <strong class="red--text text--darken-2">All data on your device will be lost.</strong>
        </v-card-text>
      </v-card>

      <v-card
        outlined
        max-width="16rem"
        class="ma-4 d-flex flex-column justify-space-between"
        ripple
        :color="$root.$data.installType === 'update' ? 'grey lighten-4' : null"
        :class="$root.$data.installType === 'update' ? 'v-card--selected' : null"
        @click="setType('update')"
      >
        <div>
          <v-card-title class="mt-n2">
            <v-icon class="pr-2 py-2" color="rgba(0, 0, 0, 0.87)">mdi-update</v-icon>
            Update</v-card-title
          >
          <v-card-text
            >Update from an older version of {{ $root.$data.OS_NAME }}. Your data won’t be
            affected.
          </v-card-text>
        </div>
      </v-card>
    </div>

    <div class="d-flex justify-space-between flex-row-reverse">
      <v-btn color="primary" @click="emit('nextStep')" :disabled="$root.$data.installType === null"
        >Next <v-icon dark right>mdi-arrow-right</v-icon></v-btn
      >
      <v-btn text @click="emit('prevStep')">Back</v-btn>
    </div>
  </v-container>
</template>

<style>
.theme--light.v-sheet--outlined {
  border-width: 2px;
}

.theme--light.v-sheet--outlined.v-card--selected {
  border: 2px solid rgba(0, 0, 0, 0.77) !important;
}
</style>

<script>
export default {
  name: "InstallTypeStep",

  props: ["device", "blobStore", "active"],

  data: () => ({
    firstSet: true,
  }),

  inject: ["emit", "saEvent"],

  methods: {
    setType(newType) {
      this.$root.$data.installType = newType

      if (this.firstSet) {
        this.firstSet = false
        this.emit("nextStep")
      }

      this.saEvent(`install_type__${newType}`)
    },
  },

  watch: {
    active: {
      async handler(newState) {
        if (newState) {
          this.saEvent("step_installtype")
        }
      },
      immediate: true,
    },
  },
}
</script>
