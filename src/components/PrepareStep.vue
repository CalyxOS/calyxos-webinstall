<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mb-10 mt-n4" v-if="usbSupported">
      <h1 class="pb-4 mt-0">Get started</h1>

      <div class="text-body-1">
        <p>
          Here are simple steps to install CalyxOS on your device. In the following steps, most
          actions are done through clicking buttons on this page. Please follow the instruction
          carefully to ensure successful installation.
        </p>
        <p class="mt-2">
          ⚠️
          <strong
            >In the next steps, your phone will get wiped. Please make sure you back up your
            phone's data securely before you proceed.</strong
          >
        </p>

	<p class="mt-2">
          ⚠️
          <strong
            >Motorola devices should follow the <a href="https://en-us.support.motorola.com/app/standalone/bootloader/unlock-your-device-a">official Motorola guide</a> to get unlocked. This process can take up to three days and unlocking your Moto devices will void its warranty. </strong
          >
        </p>

      </div>

      <h2 class="text-h2 pb-4 mt-4">Prepare your Android device</h2>

      <p class="text-body-1">
        There are a few things you must do to prepare your device to accept a new operating system.
      </p>

      <h3 class="text-h3 mt-4">Remove SIM card</h3>

      <p class="text-body-1 mt-2">
        On brand new devices, especially those obtained from a carrier, it’s better to remove the
        SIM card from the device before starting it for the first time, to help with the “OEM
        Unlocking” step below.
      </p>

      <h3 class="text-h3 mt-4">Enable Developer Options</h3>

      <p class="text-body-1 mt-2">
        <strong>Settings</strong> → <strong>About Phone</strong> → tap
        <strong>Build number</strong> 7 times
      </p>

      <h3 class="text-h3 mt-4">Enable OEM Unlocking</h3>

      <p class="text-body-1 mt-2">
        <strong>Settings</strong> → <strong>System</strong> → <strong>Advanced</strong> →
        <strong>Developer Options</strong> → <strong>OEM unlocking</strong>
      </p>

      <p class="text-body-1 mt-2">
        This step might fail if there is no internet connection. In that case, connect to a WiFi
        network and then try again.
      </p>
    </div>

    <div class="mb-10 mt-n4" v-else>
      <h3 class="text-h3 pb-4 red--text text--darken-4">Your browser isn’t supported</h3>

      <div class="text-body-1">
        <p>
          Unfortunately, you can’t use this web installer for CalyxOS because your browser doesn’t
          support WebUSB. Only Google Chrome and other browsers based on Chromium, such as Brave
          and Microsoft Edge, are supported.
        </p>
      </div>

      <div class="text-body-1 mt-4">
        <p>
          If you think this is a mistake, update your browser to the latest version and try again.
        </p>
      </div>
    </div>

    <div class="d-flex justify-space-between flex-row-reverse">
      <v-btn color="primary" @click="store.nextStep" :disabled="!usbSupported">
        Start
        <v-icon dark right>mdi-arrow-right</v-icon>
      </v-btn>
    </div>
  </v-container>
</template>

<script setup>
import { store } from "../store.js"

const usbSupported = Boolean(navigator.usb)
</script>
