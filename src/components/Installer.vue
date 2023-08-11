<template>
    <div>
        <v-stepper
            ref="stepper"
            v-model="curStep"
            :alt-labels="!$vuetify.display.mobile"
            class="d-flex flex-column flex-grow-1"
            @errorConnectSelect="errorConnectSelect"
            @errorConnectUdev="errorConnectUdev"
            @errorClaim="errorClaim"
            @errorDisconnect="errorDisconnect"
            @errorStorage="errorStorage"
            @errorTimeout="errorTimeout"
            @requestDeviceReconnect="reconnectCallback"
            @prevStep="curStep -= 1"
            @nextStep="curStep += 1"
            :items="['Start', 'Select', 'Connect', 'Unlock', 'Download', 'Install', 'Finish']"
            hideActions
        >
            <template v-slot:[`item.1`]>
                <prepare-step
                    :device="device"
                    :blob-store="blobStore"
                    :active="curStep === 1"
                />
            </template>
            
            <template v-slot:[`item.2`]>
                <install-type-step
                    :device="device"
                    :blob-store="blobStore"
                    :active="curStep === 2"
                />
            </template>

            <template v-slot:[`item.3`]>
                <connect-step
                    :device="device"
                    :blob-store="blobStore"
                    :active="curStep === 3"
                />
            </template>
            
            <template v-slot:[`item.4`]>
                <unlock-step
                    :device="device"
                    :blob-store="blobStore"
                    :curStep="curStep"
                    stepNum="4"
                />
            </template>

            <template v-slot:[`item.5`]>
                <download-step
                    :device="device"
                    :blob-store="blobStore"
                    :active="curStep === 5"
                />
            </template>
                
            <template v-slot:[`item.6`]>
                <install-step
                    :device="device"
                    :blob-store="blobStore"
                    :active="curStep === 6"
                />
            </template>
                
            <template v-slot:[`item.7`]>
                <finish-step
                    :device="device"
                    :blob-store="blobStore"
                    :active="curStep === 7"
                />
            </template>            

        </v-stepper>

        <v-dialog v-model="connectSelectDialog" :width="userAgent.includes('Windows') ? 600 : 500">
            <v-card>
                <v-card-title class="headline">No device selected</v-card-title>

                <v-card-text>
                    <p>
                        You need to select a device to continue installing.
                    </p>
                    <p>
                        Device not showing up? Try following these steps:
                        <ul class="ml-4 mb-4">
                            <li>Put your device into bootloader mode</li>
                            <li>Use a different cable</li>
                            <li>Clean your USB port</li>
                            <li>Don’t use USB hubs</li>
                            <li>Make sure the cable isn’t loose</li>
                        </ul>
                    </p>
                    <p v-if="userAgent.includes('Windows')">
                        If it’s still not working, you need to install Windows drivers:
                        <ol class="ml-4 mb-4">
                            <li>Plug your device into your computer while it’s in bootloader mode</li>
                            <li>Open Settings → Windows Update</li>
                            <li>Click “Check for updates” and wait</li>
                            <li>Click “View optional updates”</li>
                            <li>Select the “Android Bootloader Interface” update (ignore the brand name)</li>
                            <li>Click “Download and install” and wait</li>
                            <li>Unplug your device and plug it back in</li>
                        </ol>
                    </p>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="retryConnectSelect">
                        Retry
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="connectUdevDialog" width="500" persistent>
            <v-card>
                <v-card-title class="headline">Access denied</v-card-title>

                <v-card-text>
                    <p>
                        On Linux, users aren’t allowed to access USB devices by
                        default.
                    </p>
                    <p>
                        To fix this, install Android udev rules on your system:
                    </p>

                    <v-list>
                        <v-list-item title="Arch Linux" subtitle="sudo pacman -S
                                    android-udev" lines="two">
                        </v-list-item>

                        <v-list-item title="Debian, Ubuntu" subtitle="sudo apt install
                                    android-sdk-platform-tools-common" lines="two">
                        </v-list-item>

                        <v-list-item title="Other distributions" subtitle="Instructions vary" lines="two">
                        </v-list-item>
                    </v-list>

                    <p>
                        Once you’ve installed udev rules, unplug your device and
                        plug it back in for it to take effect.
                    </p>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="retryConnectUdev">
                        Retry
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="claimDialog" width="500" persistent>
            <v-card>
                <v-card-title class="headline">
                    Can’t control device
                </v-card-title>

                <v-card-text>
                    <p>
                        Another app is taking control of your device, so we
                        can’t talk to it.
                    </p>
                    <p>
                        This is usually caused by having this installer open in
                        another browser tab.
                    </p>
                    <p>
                        To fix this, close all other web installer tabs in your
                        browser and make sure you don’t have any tabs remaining
                        in other windows.
                    </p>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="retryClaim">
                        Retry
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="disconnectDialog" width="500" persistent>
            <v-card>
                <v-card-title class="headline">
                    Device disconnected
                </v-card-title>

                <v-card-text>
                    <p>
                        Your device disconnected, so we can’t
                        continue installing.
                    </p>
                    <p>
                        To fix this:
                        <ul class="ml-4 mb-4">
                            <li>Don’t touch the device</li>
                            <li>Use a different cable</li>
                            <li>Clean your USB port</li>
                            <li>Don’t use USB hubs</li>
                            <li>Make sure the cable isn’t loose</li>
                        </ul>
                    </p>
                    <connect-banner
                        :device="device"
                        :connecting="disconnectReconnecting"
                        :error="disconnectReconnectError"
                    />
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="retryDisconnect">
                        Retry
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="storageDialog" width="500" persistent>
            <v-card>
                <v-card-title class="headline">Out of storage</v-card-title>

                <v-card-text>
                    <p>
                        There isn’t enough storage space available to download
                        and unpack the OS. You need at least 5 GB free.
                    </p>
                    <p>
                        If you’re not low on storage, this is caused by
                        using an incognito window or guest browser profile. These profiles have very low storage limits, so
                        installing from them isn’t possible.
                    </p>
                    <p>
                        To fix this,
                        <strong>switch to a normal browser profile</strong>
                        and try again.
                    </p>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="retryStorage">
                        Retry
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="memoryDialog" width="500" persistent>
            <v-card>
                <v-card-title class="headline">Out of memory</v-card-title>

                <v-card-text>
                    <p>
                        There isn’t enough free memory (RAM) to unpack and
                        install the OS.
                    </p>
                    <p>
                        To fix this,
                        <strong>close some unused apps</strong> and try again.
                    </p>
                    <p>
                        If it still doesn’t work, you may need to install from
                        another computer or device with more memory.
                    </p>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="retryMemory">
                        Retry
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="reconnectDialog" width="500" persistent>
            <v-card>
                <v-card-title class="headline">Reconnect device</v-card-title>

                <v-card-text>
                    To continue installing, allow access to your device again.
                    <v-banner
                        single-line
                        outlined
                        rounded
                        class="mt-8"
                        v-if="reconnectError"
                    >
                        <v-icon slot="icon" color="red darken-3"
                            >mdi-close</v-icon
                        >
                        <div class="my-4">
                            <span
                                class="text-body-1 red--text text--darken-3"
                                >{{ reconnectError }}</span
                            >
                        </div>
                    </v-banner>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="requestReconnect">
                        Reconnect
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="timeoutDialog" width="500" persistent>
            <v-card>
                <v-card-title class="headline">Device is stuck</v-card-title>

                <v-card-text>
                    <p>
                        The connection to your device is stuck.
                    </p>
                    <p>
                        To fix this, use the volume buttons to highlight <strong>“Restart bootloader”</strong> in the bootloader menu, and press the power button to select it.
                    </p>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="retryTimeout">
                        Retry
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
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
import { logEvent } from "@/core/common";
import * as errors from "@/core/errors";
import * as fastboot from "android-fastboot";
import { BlobStore } from "@/core/download";
import ConnectBanner from "@/components/ConnectBanner.vue";
import PrepareStep from "@/components/PrepareStep.vue";
import InstallTypeStep from "@/components/InstallTypeStep.vue";
import ConnectStep from "@/components/ConnectStep.vue";
import UnlockStep from "@/components/UnlockStep.vue";
import DownloadStep from "@/components/DownloadStep.vue";
import InstallStep from "@/components/InstallStep.vue";
import FinishStep from "@/components/FinishStep.vue";

fastboot.setDebugLevel(2);

let device = new fastboot.FastbootDevice();
let blobStore = new BlobStore();

export default {
    name: "WebInstaller",
    
    components: {
        PrepareStep,
        InstallTypeStep,
        ConnectStep,
        UnlockStep,
        DownloadStep,
        InstallStep,
        FinishStep,
        ConnectBanner,
    },

    data: () => ({
        device: device,
        blobStore: blobStore,
        curStep: 1,
        userAgent: navigator.userAgent,

        connectSelectDialog: false,
        connectUdevDialog: false,
        claimDialog: false,
        storageDialog: false,
        memoryDialog: false,
        timeoutDialog: false,
        retryCallbacks: [],

        disconnectDialog: false,
        disconnectReconnecting: false,
        disconnectReconnectError: null,

        reconnectDialog: false,
        reconnectError: null,
    }),

    methods: {
        emitError(err, retryCallback = undefined) {
            let errEvent = null;
            let errMessage = err.message;
            if (errors.isConnectSelectError(err)) {
                errEvent = "ConnectSelect";
                errMessage = "No device selected";
            } else if (errors.isConnectUdevError(err)) {
                errEvent = "ConnectUdev";
                errMessage = "Access denied";
            } else if (errors.isClaimError(err)) {
                errEvent = "Claim";
                errMessage = "Can’t control device";
            } else if (errors.isDisconnectError(err)) {
                errEvent = "Disconnect";
                errMessage = "Device disconnected";
            } else if (errors.isStorageError(err)) {
                errEvent = "Storage";
                errMessage = "Out of storage";
            } else if (errors.isMemoryError(err)) {
                errEvent = "Memory";
                errMessage = "Out of memory";
            } else if (errors.isTimeoutError(err)) {
                errEvent = "Timeout";
                errMessage = "Device is stuck";
            }

            if (errEvent !== null) {
                if ("handleSelfError" in this) {
                    this.handleSelfError(
                        `error${errEvent}`,
                        retryCallback || this.errorRetry
                    );
                }

                this.emit(
                    `error${errEvent}`,
                    retryCallback || this.errorRetry
                );
            }

            return [errEvent !== null, errMessage];
        },
    
        saEvent(event) {
            logEvent(event);
        },

        emit(event, ...args) {
            this.$refs.stepper.$emit(event, ...args);
        },

        handleSelfError(error, retryCallback) {
            this.$refs.stepper.$emit(error, retryCallback);
        },

        errorConnectSelect(retry) {
            this.connectSelectDialog = true;
            this.retryCallbacks.push(retry);
        },
        retryConnectSelect() {
            this.connectSelectDialog = false;
            this.retryCallbacks.pop();
        },

        errorConnectUdev(retry) {
            this.connectUdevDialog = true;
            this.retryCallbacks.push(retry);
        },
        retryConnectUdev() {
            this.connectUdevDialog = false;
            this.retryCallbacks.pop();
        },

        errorClaim(retry) {
            this.claimDialog = true;
            this.retryCallbacks.push(retry);
        },
        retryClaim() {
            this.claimDialog = false;
            this.retryCallbacks.pop();
        },

        errorDisconnect(retry) {
            this.$root.$data.product = null;

            this.disconnectReconnecting = false;
            this.disconnectReconnectError = null;
            this.disconnectDialog = true;
            this.retryCallbacks.push(retry);
        },
        async retryDisconnect() {
            this.disconnectReconnecting = true;
            this.$root.$data.product = null;

            try {
                await this.device.connect();
                this.$root.$data.product = await this.device.getVariable(
                    "product"
                );
                this.disconnectReconnectError = null;
            } catch (e) {
                let [handled, message] = this.emitError(this, e);
                this.disconnectReconnectError = message;
                if (!handled) {
                    throw e;
                }

                this.disconnectReconnecting = false;
                return;
            }

            this.disconnectReconnecting = false;
            this.disconnectDialog = false;
            this.retryCallbacks.pop();
        },

        errorStorage(retry) {
            this.storageDialog = true;
            this.retryCallbacks.push(retry);
        },
        retryStorage() {
            this.storageDialog = false;
            this.retryCallbacks.pop();
        },

        errorMemory(retry) {
            this.memoryDialog = true;
            this.retryCallbacks.push(retry);

            this.saEvent("error__out_of_memory");
        },
        retryMemory() {
            this.memoryDialog = false;
            this.retryCallbacks.pop();
        },

        reconnectCallback() {
            this.reconnectError = null;
            this.reconnectDialog = true;
        },
        async requestReconnect() {
            try {
                await this.device.connect();
                this.reconnectDialog = false;
                this.reconnectError = null;
            } catch (e) {
                this.reconnectError = e.message;
            }
        },

        errorTimeout(retry) {
            this.timeoutDialog = true;
            this.retryCallbacks.push(retry);
        },
        retryTimeout() {
            this.timeoutDialog = false;
            this.retryCallbacks.pop();
        },
    },
    
    provide() {
        return {
            emitError: this.emitError,
            emit: this.emit,
            saEvent: this.saEvent
        }
    }
};
</script>
