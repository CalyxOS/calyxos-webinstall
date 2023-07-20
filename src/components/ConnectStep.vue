<template>
    <v-container class="d-flex justify-space-between flex-column flex-grow-1">
        <div class="mb-10 mt-n4">
            <h6 class="text-h6 pb-4">Connect your device</h6>

            <div class="text-body-1">
                <p>
                    Put your device into bootloader mode by restarting it and
                    holding the
                    <strong>volume down</strong> button.
                </p>
                <p>
                    Once your device is in bootloader mode, plug it into the
                    computer or device you’re installing from. Make sure you use
                    a
                    <strong>high-quality</strong> USB cable, as many cables will
                    cause issues. Avoid USB hubs if possible.
                </p>
                <p>
                    Your USB cable needs to be able to copy files. Charging-only
                    cables won’t work.
                </p>
            </div>

            <v-btn
                :color="$root.$data.product === null ? 'primary' : null"
                @click="connect"
                :disabled="connecting"
                >Connect</v-btn
            >
        </div>

        <div class="mb-4">
            <connect-banner
                :device="device"
                :connecting="connecting"
                :error="error"
            />
        </div>

        <div class="d-flex justify-space-between flex-row-reverse">
            <v-btn
                color="primary"
                @click="emit('nextStep')"
                :disabled="$root.$data.product === null"
                >Next <v-icon dark right>mdi-arrow-right</v-icon></v-btn
            >
            <v-btn text @click="emit('prevStep')">Back</v-btn>
        </div>
    </v-container>
</template>

<script>
import ConnectBanner from "./ConnectBanner.vue";

export default {
    name: "ConnectStep",

    components: {
        ConnectBanner,
    },
    
    data: () => ({
        connecting: false,
        error: null,
        firstConnect: true,
    }),
    
    inject: ['emitError', 'emit', 'saEvent'],
    
    methods: {
        async errorRetry() {
            await this.connect();
        },

        async connect() {
            this.connecting = true;

            try {
                await this.device.connect();
                this.$root.$data.product = await this.device.getVariable(
                    "product"
                );
                this.error = null;

                if (this.firstConnect) {
                    this.firstConnect = false;
                    this.emit("nextStep");
                }

                this.saEvent(`device_connect__${this.$root.$data.product}`);
            } catch (e) {
                let [handled, message] = this.emitError(this, e);
                this.error = message;
                if (!handled) {
                    throw e;
                }
            } finally {
                this.connecting = false;
            }
        },
    },

    props: ["device", "blobStore", "active"],

    watch: {
        active:{
            handler(newState) {
                if (newState) {
                    this.saEvent("step_connect");
                }
            },
            immediate: true
        },
    },
};
</script>
