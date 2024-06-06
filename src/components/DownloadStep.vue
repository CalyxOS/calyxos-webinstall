<template>
    <v-container class="d-flex justify-space-between flex-column flex-grow-1">
        <v-skeleton-loader v-if="latestRelease === null" type="article, actions">
	</v-skeleton-loader>
        <div class="text-center" v-else-if="latestRelease === undefined">
            <p class="text-h5 red--text text--darken-3">
                Your device isn’t supported
            </p>
        </div>
        <div v-else class="d-flex flex-wrap justify-space-around">
	  <p class="mt-4 text-h6 font-weight-regular">Download the latest stable build of {{ $root.$data.OS_NAME }}: <span class="font-weight-bold">{{ latestRelease.version }}</span></p>
          <v-card
                :key="latestRelease.url"
                outlined
                max-width="16rem"
                class="ma-4 d-flex flex-column"
                ripple
                :color="downloading ? 'grey lighten-4' : null"
                :disabled="downloading"
                @click="download(latestRelease)">
                <v-card-title>Start Download</v-card-title>
            </v-card>
        </div>

        <div>
            <v-banner
                single-line
                outlined
                rounded
                v-if="downloadProgress >= 100"
            >
                <v-icon slot="icon" color="green darken-3">mdi-check</v-icon>
                <div class="my-4">
                  <span class="text-body-1 green--text text--darken-3">
		    Downloaded {{ $root.$data.OS_NAME }}
                    {{ latestRelease.codename }}-{{ latestRelease.version}}
		  </span>
                </div>
            </v-banner>
            <v-banner
                icon="mdi-download"
                rounded
                class="mt-8 pt-1"
                v-else-if="downloadProgress !== null"
            >
                <v-banner-text class="text-body-1">Downloading…</v-banner-text>
            </v-banner>
            <v-progress-linear
                class="my-3"
                buffer-value="0"
                v-model="downloadProgress"
                stream
                v-if="downloadProgress !== null"
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
                :disabled="$root.$data.zipBlob === null"
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
    name: "DownloadStep",

    props: ["device", "blobStore", "active"],

    data: () => ({
        releaseIndex: null,
        latestRelease: null,
        downloadProgress: null,
        downloadingRelease: null,
        downloading: false,
        error: null,
    }),

    methods: {
        async errorRetry() {
            await this.download(this.$root.$data.release);
        },

        async download(release) {
            this.$root.$data.release = release;
            this.downloadProgress = 0;
            this.downloading = true;
            this.downloadingRelease = release;

            try {
                this.saEvent(
                    `download_build__${this.$root.$data.product}_${release.version}_${release.variant}`
                );
                await this.blobStore.init();

		let blob = await this.blobStore.download(
		    release.url,
                    (progress) => {
                        this.downloadProgress = progress * 100;
                    }
                );

                this.downloadProgress = 100;
                this.$root.$data.zipBlob = blob;
                this.error = null;
		this.emit("nextStep");
            } catch (e) {
                this.downloadProgress = null;

                let [handled, message] = this.emitError(e);
                this.error = message;
                if (!handled) {
                    throw e;
                }

	    } finally {
                this.downloading = false;
            }
        },
    },

    inject: ['emit', 'emitError', 'saEvent'],

    watch: {
        active: {
            async handler(newState) {
                if (newState) {
                    this.saEvent("step_download");

                    if (!this.releaseIndex) {
			let indexResp = await fetch("/releases/index.json");
                        this.releaseIndex = await indexResp.json();
		        this.saEvent(`release index: ${JSON.stringify(this.releaseIndex)}`);
                    }
                    this.latestRelease = this.releaseIndex[this.$root.$data.product];
                }
            },
            immediate: true
        },
    },
};
</script>
