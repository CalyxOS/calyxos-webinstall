<template>
  <div>
    <v-stepper
      ref="stepper"
      v-model="curStep"
      class="d-flex flex-column flex-grow-1"
      :items="['Start', 'Connect', 'Unlock', 'Download', 'Install', 'Lock', 'Finish']"
      hideActions
    >
      <template v-slot:[`item.1`]>
        <prepare-step />
      </template>

      <template v-slot:[`item.2`]>
        <connect-step />
      </template>

      <template v-slot:[`item.3`]>
        <unlock-step />
      </template>

      <template v-slot:[`item.4`]>
        <download-step />
      </template>

      <template v-slot:[`item.5`]>
        <install-step />
      </template>

      <template v-slot:[`item.6`]>
        <lock-step />
      </template>

      <template v-slot:[`item.7`]>
        <finish-step />
      </template>
    </v-stepper>
  </div>
</template>

<script>
import { FastbootClient, FastbootFlasher } from "@aepyornis/fastboot.ts"

import ConnectBanner from "@/components/ConnectBanner.vue"
import PrepareStep from "@/components/PrepareStep.vue"
//import InstallTypeStep from "@/components/InstallTypeStep.vue";
import ConnectStep from "@/components/ConnectStep.vue"
//import UnlockStep from "@/components/UnlockStep.vue"
//import DownloadStep from "@/components/DownloadStep.vue"
//import InstallStep from "@/components/InstallStep.vue"
//import LockStep from "@/components/LockStep.vue"
//import FinishStep from "@/components/FinishStep.vue"

export default {
  name: "WebInstaller",

  components: {
    PrepareStep,
    ConnectStep,
    /* UnlockStep,
     * DownloadStep,
     * InstallStep,
     * LockStep,
     * FinishStep,
     * ConnectBanner, */
  },

  data() {
    return {
      client: this.client,
      curStep: 1,
    }
  },

  provide() {
    return {
      nextStep: this.nextStep,
      prevStep: this.prevStep,
      client: this.client,
      createClient: this.createClient,
    }
  },

  methods: {
    async createClient() {
      if (this.client) {
        throw new Error("FastbootClient already connected")
      }

      this.client = await FastbootClient.create()
    },

    nextStep() {
      this.curStep++
    },
    prevStep() {
      this.curStep--
    },
  },
}
</script>
