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

      <div v-if="isLinux">
        <h3 class="text-h3 mt-4">For Linux users</h3>

        <p class="text-body-1">
          For users on <b>Ubuntu-based distros</b>, it is important to highlight that the use of browsers in <b>Snap packages</b> is not supported and does not work with our web installer. Make sure that you're using a native package, for Ubuntu, it may force a Snap on you.
        </p>
        <p class="text-body-1">
            It may be required for the user to get udev rules from Android Platform Tools, this has been since been addressed in systemd, and it should not be required going forward, however, some distros, notably <i>Linux Mint</i>, do not have this available out of the box yet.
        </p>

        <p class="text-body-1 mt-2">
          On Debian-based distros (Ubuntu, Mint), install the udev rules with the following command:
        </p>
        <pre>
            sudo apt update
            sudo apt install android-sdk-platform-tools-common
        </pre>
      </div>

      <div v-else-if="isWindows">
        <h3 class="text-h3 mt-4">For Windows users</h3>

        <p class="text-body-1">
          In order to make sure that the device will be recognized properly at all stages of the installation process, you must install the Google USB drivers.
        </p>
        <p class="text-body-1">
          Download them <a href="https://developer.android.com/studio/run/win-usb">here</a>, extract the archive, open the extracted folder, select and right click on <b>Android_winusb</b> (.inf), then finally, hit <b>Install</b>.
        </p>
        <p class="text-body-1">
          Also check for other drivers Windows may not be installing automatically for your device:
          Open Windows Update, hit "Check for updates", then "Advanced options", then "Optional drivers", select drivers mentioning "Android", "ADB", and/or "Fastboot" and install.
        </p>
        <p class="text-body-1">
          Before checking for and installing drivers, it may help to boot the device into fastboot/bootloader mode before so that Windows is aware of the device.
        </p>
      </div>
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

<script setup lang="ts">
/// <reference types="user-agent-data-types" />

import { store } from "../store"

const usbSupported = Boolean(navigator.usb)
const isLinux = (navigator.userAgentData?.platform === 'Linux')
const isWindows = (navigator.userAgentData?.platform === 'Windows')
</script>
