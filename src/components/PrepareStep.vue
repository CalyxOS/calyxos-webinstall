<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mb-10 mt-n4" v-if="usbSupported">
      <h5 class="text-h5 pb-4">Get started</h5>

      <div class="text-body-1">
        <p>
          Here are simple steps to install {{ $root.$data.OS_NAME }}
          on your device. In the following steps, most actions are done through clicking buttons on
          this page. Please follow the instruction carefully to ensure successful installation.
        </p>
        <p class="mt-2">
          ⚠️
          <strong
            >In the next steps, your phone will get wiped. Please make sure you back up your
            phone's data securely before you proceed.</strong
          >
        </p>
      </div>

      <h5 class="text-h5 pb-4 mt-4">Prepare your Android device</h5>

      <p class="text-body-1">
        There are a few things you must do to prepare your device to accept a new operating system.
      </p>

      <h6 class="text-h6 mt-4">Remove SIM card</h6>

      <p class="text-body-1 mt-2">
        On brand new devices, especially those obtained from a carrier, it’s better to remove the
        SIM card from the device before starting it for the first time, to help with the “OEM
        Unlocking” step below.
      </p>

      <h6 class="text-h6 mt-4">Enable Developer Options</h6>

      <p class="text-body-1 mt-2">
        <strong>Settings</strong> → <strong>About Phone</strong> → tap
        <strong>Build number</strong> 7 times
      </p>

      <h6 class="text-h6 mt-4">Enable OEM Unlocking</h6>

      <p class="text-body-1 mt-2">
        <strong>Settings</strong> → <strong>System</strong> → <strong>Advanced</strong> →
        <strong>Developer Options</strong> →
        <strong>OEM unlocking</strong>
      </p>

      <p class="text-body-1 mt-2">
        This step might fail if there is no internet connection. In that case, connect to a WiFi
        network and then try again.
      </p>
    </div>

    <div class="mb-10 mt-n4" v-else>
      <h6 class="text-h6 pb-4 red--text text--darken-4">Your browser isn’t supported</h6>

      <div class="text-body-1">
        <p>
          Unfortunately, you can’t use this web installer for
          {{ $root.$data.OS_NAME }} because your browser doesn’t support WebUSB. Only Google Chrome
          and other browsers based on Chromium, such as Brave and Microsoft Edge, are supported.
        </p>
      </div>

      <div class="text-body-1 mt-4">
        <p>
          If you think this is a mistake, update your browser to the latest version and try again.
        </p>
      </div>
    </div>

    <div class="d-flex justify-space-between flex-row-reverse">
      <v-btn color="primary" @click="emit('nextStep')" :disabled="!usbSupported">
        Start
        <v-icon dark right>mdi-arrow-right</v-icon>
      </v-btn>
    </div>
  </v-container>
</template>

<script>
export default {
  props: ["device", "active"],

  data: () => ({
    usbSupported: "usb" in navigator,
  }),

  inject: ["emit", "saEvent"],

  watch: {
    active: {
      async handler(newState) {
        if (newState) {
          this.saEvent("step_prepare")
        }
      },
      immediate: true,
    },
  },
}
</script>
