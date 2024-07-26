<template>
    <v-container class="d-flex justify-space-between flex-column flex-grow-1">
        <div class="mt-n4">
            <h6 class="text-h6 pb-4">Lock the bootloader on your phone</h6>

            <div class="text-body-1 mb-4">
                <p>
                  Lock the bootloader using the volume buttons on your phone
                </p>
            </div>

            <v-btn
                color="primary"
                @click="lock"
                :disabled="locking || locked"
                >Lock</v-btn
            >
        </div>

        <div class="mb-4">
            <v-banner single-line outlined rounded class="mt-4" v-if="locked">
                <v-icon slot="icon" color="green darken-3">mdi-check</v-icon>
                <span class="text-body-1 green--text text--darken-3"
                    >Bootloader locked</span
                >
            </v-banner>
            <v-banner
                single-line
                outlined
                rounded
                class="mt-4"
                v-else-if="locking"
            >
                <v-progress-circular
                    slot="icon"
                    indeterminate
                    color="primary"
                ></v-progress-circular>
                <span class="text-body-1"
                    >Locking bootloader… Confirm using the volume and power
                    buttons.</span
                >
            </v-banner>
            <v-banner
                single-line
                outlined
                rounded
                class="mt-4"
                v-else-if="error"
            >
                <v-icon slot="icon" color="red darken-3">mdi-close</v-icon>
                <span class="text-body-1 red--text text--darken-3">{{
                    error
                }}</span>
            </v-banner>
        </div>

        <div class="d-flex justify-space-between flex-row-reverse">
            <v-btn
                color="primary"
                @click="emit('nextStep')"
                :disabled="!locked"
                >Finish <v-icon dark right>mdi-arrow-right</v-icon></v-btn
            >
            <v-btn text @click="emit('prevStep')">Back</v-btn>
        </div>
    </v-container>
</template>

<script>
import { FastbootError } from "android-fastboot";

export default {
    name: "LockStep",

    props: ["device", "blobStore", "curStep", "stepNum"],

    data: () => ({
        locking: false,
        locked: undefined,
        initialLocked: undefined,
        error: null,
    }),

    inject: ['emit', 'emitError', 'saEvent'],

    watch: {
        curStep: async function (newStep, oldStep) {
            if (newStep == this.stepNum) {
                this.saEvent("step_lock");

                try {
                    // Get lock state once and save it. Not all bootloaders
                    // update the locked value immediately after locking.

                    if (this.locked === undefined) {
                        this.locked = (await this.device.getVariable("unlocked")) === "no";
                        this.initialLocked = this.locked;
                    }

                    // Skip step only if lock state was never changed
                    if (this.locked && this.initiallocked) {
                        if (newStep > oldStep) {
                            this.emit("nextStep");
                        } else {
                            this.emit("prevStep");
                        }
                    }

                    this.error = null;
                } catch (e) {
                    let [handled, message] = this.emitError(e);
                    this.error = message;
                    if (!handled) {
                        throw e;
                    }
                }
            }
        },
    },

    methods: {
        async errorRetry() {
            await this.lock();
        },

        async lock() {
            this.locking = true;

            try {
                if (!this.device.isConnected) {
                    await this.device.connect();
                }

                // Locking can't be done in fastbootd
                if ((await this.device.getVariable("is-userspace")) === "yes") {
                    await this.device.reboot("bootloader", true, () => {
                        this.emit("requestDeviceReconnect");
                    });
                }

	        try {
                    await this.device.runCommand("flashing lock");
	        } catch (e) {
		    if (e instanceof FastbootError && e.status === "FAIL") {
                        if (e.message.includes("already")) {
                            /* Already locked = success */
                        } else if (e.message.includes("canceled")) {
                            throw new Error("Lock request was canceled");
                        }
                    } else {
                        throw e;
                    }
	        }

                // pause while lock message is on screen
                const pause = 15;
                await (new Promise(resolve => setTimeout(resolve, (pause * 1000))));

                // until the user confirms on the phone, fastboot cannot connect
                while (!this.device.isConnected) {
                    await (new Promise(resolve => setTimeout(resolve, 1000)))
                }

                if ((await this.device.getVariable("unlocked")) === "no") {
                    await this.device.reboot("");
                    this.locked = true;
                    this.locking = false;
                    this.error = null;
                    this.saEvent(`lock_bootloader__${this.$root.$data.product}`);
                } else {
                    throw new Error("Device is not locked");
                }

            } catch (e) {
                this.locking = false;

                //if (e instanceof DOMException && e.message.includes('A transfer error has occurred')) {
	        //     this.error = 'A transfer error has occurred'
	        // }

                let [handled, message] = this.emitError(e);
                this.error = message;
                if (!handled) {
                    throw e;
                }
            }

        },
    },
};
</script>
