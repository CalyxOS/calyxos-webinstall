<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mt-n4 flex-grow-1" v-if="!release">
      <p class="mt-2"><strong>⚠️ Something went wrong</strong>Try starting over</p>
    </div>

    <div class="mt-n4 flex-grow-1" v-else>
      <h6 class="text-h6 pb-4">Install {{ $root.$data.OS_NAME }}</h6>

      <div class="text-body-1">
        <p>
          This will install <strong>{{ $root.$data.OS_NAME }} ({{ release.version }})</strong> on
          your <strong>{{ release.name ? release.name : $root.$data.product }}</strong
          >. Your phone will restart several times.
        </p>
        <p v-if="$root.$data.installType === 'clean'">
          Because you’re doing a clean install,
          <strong class="red--text text--darken-3"
            >all data on your device will be permanently lost.</strong
          >
        </p>
        <p class="mt-2">
          <strong>⚠️ Don’t touch, unplug, or press any buttons</strong> on your device during
          <i>this process</i> or else the installation may be failed. Watch the progress bar on
          this page to check the status.
        </p>
        <p class="mt-2">This may take 10-15 minutes.</p>
      </div>

      <v-btn
        :color="installed ? null : 'primary'"
        :disabled="installProgress !== null"
        @click="install"
        class="mt-2"
        >Install</v-btn
      >
    </div>

    <div class="pb-8">
      <v-banner single-line outlined rounded v-if="installed">
        <v-icon color="green darken-3">mdi-check</v-icon>
        <div class="my-4">
          <span class="text-body-1 green--text text--darken-3">
            Installed {{ $root.$data.OS_NAME }} {{ release.version }} ({{ release.date }})
          </span>
        </div>
      </v-banner>
      <v-banner rounded class="mt-8 pt-1" v-else-if="installProgress !== null">
        <v-icon color="primary">{{ installStatusIcon }}</v-icon>
        <v-banner-text class="text-body-1">
          {{ installStatus }}
        </v-banner-text>
      </v-banner>
      <v-progress-linear
        class="my-3"
        buffer-value="0"
        v-model="installProgress"
        stream
        v-if="installProgress !== null"
      ></v-progress-linear>
      <v-banner single-line outlined rounded class="mt-8" v-else-if="error">
        <v-icon color="red darken-3">mdi-close</v-icon>
        <div class="my-4">
          <span class="text-body-1 red--text text--darken-3">{{ error }}</span>
        </div>
      </v-banner>
    </div>

    <div class="d-flex justify-space-between flex-row-reverse">
      <v-btn color="primary" @click="emit('nextStep')" :disabled="installing || !installed"
        >Next <v-icon dark right>mdi-arrow-right</v-icon></v-btn
      >
      <v-btn text @click="emit('prevStep')" :disabled="installing">Back</v-btn>
    </div>
  </v-container>
</template>

<style>
.v-progress-linear__determinate {
  transition: none !important;
}

.v-banner--single-line .v-banner__text {
  white-space: normal !important;
}
</style>

<script>
import * as fastboot from "android-fastboot"
import OpfsBlobStore from "opfs_blob_store"

const INSTALL_STATUS_ICONS = {
  load: "mdi-archive-arrow-down-outline",
  unpack: "mdi-archive-arrow-down-outline",
  flash: "mdi-cellphone-arrow-down",
  wipe: "mdi-cellphone-erase",
  reboot: "mdi-restart",
}

export default {
  name: "InstallStep",

  props: ["device", "active", "release"],

  data: () => ({
    installProgress: null,
    installStatus: "",
    installStatusIcon: null,
    installed: false,
    installing: false,
    firstInstall: true,
    error: null,

    memoryDialog: false,
  }),

  inject: ["emit", "emitError", "saEvent"],

  methods: {
    reconnectCallback() {
      this.emit("requestDeviceReconnect")
    },

    async retryMemory() {
      this.memoryDialog = false
      await this.install()
    },

    async errorRetry() {
      await this.install()
    },

    async install() {
      this.installed = false
      this.installing = true

      try {
        if (!this.device.isConnected) {
          await this.device.connect()
        }

        this.saEvent(
          `install_build__${this.$root.$data.product}_${this.release.version}_${this.release.variant}`,
        )

        const bs = await OpfsBlobStore.create()
        const blob = await bs.get(this.release.sha256)

        await this.device.flashFactoryZip(
          blob,
          this.$root.$data.installType === "clean",
          this.reconnectCallback,
          (action, item, progress) => {
            let userAction = fastboot.USER_ACTION_MAP[action]
            let userItem = item === "avb_custom_key" ? "verified boot key" : item
            this.installStatus = `${userAction} ${userItem}`
            this.installStatusIcon = INSTALL_STATUS_ICONS[action]
            this.installProgress = progress * 100
          },
        )

        this.installed = true
        this.error = null

        if (this.firstInstall) {
          this.firstInstall = false
          this.emit("nextStep")
        }
      } catch (e) {
        this.installed = false
        this.installProgress = null

        let [handled, message] = this.emitError(e)
        this.error = message
        if (!handled) {
          throw e
        }
      } finally {
        this.installing = false
      }
    },
  },

  watch: {
    active: {
      async handler(newState) {
        if (newState) {
          this.saEvent("step_install")
        }
      },
      immediate: true,
    },
  },
}
</script>
