<template>
    <v-container class="d-flex justify-space-between flex-column flex-grow-1">
        <div class="mt-n4 flex-grow-1" v-if="release !== null">
            <h6 class="text-h4 pb-4">Install {{ $root.$data.OS_NAME }}</h6>

            <div class="text-body-1 mb-2">
                <p>
                  This will install {{ $root.$data.OS_NAME }} ({{ release.version }})
                  on your {{ (release.name ? release.name : $root.$data.product) }}.
                </p>
                <p class="mt-2">
                  <strong class="text-red-darken-3">
                    All data on your device will be permanently lost.
                  </strong>
                </p>
                <p class="mt-2">
                    <strong>⚠️ Don’t touch, unplug, or press any
                    buttons</strong> on your device during the
                    install. on your device during <em>this process</em>
                    or else it will disturb the install.
                    <em>Watch the progress bar on this page to check the
                    status. This may take 10-15 minutes.</em>
                </p>
                <p class="mt-2">
                    Your phone will restart several times, but
                    <strong>don’t touch it.</strong> Watch the progress bar
                    on this page instead.
                </p>
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
                <v-icon slot="icon" color="green darken-3">mdi-check</v-icon>
                <div class="my-4">
                  <span class="text-body-1 green--text text--darken-3">
                    Installed {{ $root.$data.OS_NAME }} {{ release.version }} ({{ release.date }})
                  </span>
                </div>
            </v-banner>
            <v-banner
                rounded
                class="mt-8 pt-1"
                v-else-if="installProgress !== null"
            >
                <v-icon slot="icon" color="primary">{{
                    installStatusIcon
                }}</v-icon>
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
            <v-banner
                single-line
                outlined
                rounded
                class="mt-8"
                v-else-if="error"
            >
                <v-icon slot="icon" color="red darken-3">mdi-close</v-icon>
                <div class="my-4">
                    <span class="text-body-1 red--text text--darken-3">{{
                        error
                    }}</span>
                </div>
            </v-banner>
        </div>

        <div class="d-flex justify-space-between flex-row-reverse">
            <v-btn
                color="primary"
                @click="emit('nextStep')"
                :disabled="installing || !installed"
                >Next <v-icon dark right>mdi-arrow-right</v-icon></v-btn
            >
            <v-btn text @click="emit('prevStep')" :disabled="installing"
            >Back</v-btn
                 >
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
 const INSTALL_STATUS_ICONS = {
   load: "mdi-archive-arrow-down-outline",
   unpack: "mdi-archive-arrow-down-outline",
   flash: "mdi-cellphone-arrow-down",
   wipe: "mdi-cellphone-erase",
   reboot: "mdi-restart",
 };

 const USER_ACTION_MAP = {
   load: "Loading",
   unpack: "Unpacking",
   flash: "Writing",
   wipe: "Wiping",
   reboot: "Restarting",
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

   inject: ['emit', 'emitError', 'saEvent'],

   methods: {
     async installWorker() {
       return new Promise( (resolve, reject) => {
         const worker = new Worker(new URL("../workers/install_worker.js", import.meta.url), { "type": "module" } )
         worker.addEventListener("message", event => {
           switch (event.data.type) {
             case "progress":
               const { action, item, progress  } = event.data
               let userAction = USER_ACTION_MAP[action]
               let userItem = item === "avb_custom_key" ? "verified boot key" : item
               this.installStatus = `${userAction} ${userItem}`
               this.installStatusIcon = INSTALL_STATUS_ICONS[action]
               this.installProgress = progress * 100
               break;
             case "reconnect":
               this.reconnectError = null
               this.reconnectDialog = true
               break;
             case "error":
               this.installing = false
               this.error = event.data.e.message
               reject(event.data.e)
               break;
             case "complete":
               this.installing = false
               this.installed = true
               resolve(true)
               break;
             default:
               throw new Error(`unknown type: ${e.data.type}`)
           }
         })
         this.installing = true
         worker.postMessage({ "type": "start", "sha256": this.release.sha256 })
       })
     },

     async install() {
       this.saEvent(`install_build__${this.$root.$data.product}_${this.release.version}_${this.release.variant}`)

       this.error = null
       this.installed = false
       this.installing = true

       try {
         while (!this.device.isConnected) {
           await this.device.connect()
           await (new Promise(resolve => setTimeout(resolve, 1000)))
         }

         const numberOfDevices = (await navigator.usb.getDevices()).length
         if (numberOfDevices !== 1) {
           throw new Error('more than one usb device connected')
         }

         await this.installWorker()
       }  catch(e) {
         let [handled, message] = this.emitError(e)
         this.error = message
         if (!handled) {
           throw e
         }
       }
     }
   }
 }
</script>
