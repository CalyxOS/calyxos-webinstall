<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mt-n4 flex-grow-1" v-if="error">
      <p class="mt-2"><strong>⚠️ Something went wrong</strong>Try starting over</p>
    </div>

    <div class="mt-n4 flex-grow-1" v-else>
      <h6 class="text-h6 pb-4">Install CalyxOS</h6>

      <div class="text-body-1">
        <p>
          This will install <strong>CalyxOS ({{ store.release().version }})</strong> on your
          <strong>{{ store.release().name }}</strong
          >. Your phone will restart several times.
        </p>
        <p>
          Because you’re doing a clean install,
          <strong class="red--text text--darken-3">
            all data on your device will be permanently lost.
          </strong>
        </p>
        <p class="mt-2">
          <strong>⚠️ Don’t touch, unplug, or press any buttons</strong> on your device during
          <i>this process</i> or else the installation may fail. Watch the progress bar on this
          page to check the status.
        </p>

        <p class="mt-2">
          After a restart, you may be asked to
          <strong>click a button so that your browser may prompt you</strong> to choose a device
          and reconnect.
        </p>

        <p class="mt-2">This may take 10-15 minutes.</p>
      </div>

      <div>
        <div ref="logViewer" class="log-viewer pa-2 bg-surface text-high-emphasis">
          <div v-for="(line, i) in log" :key="i" class="log-line">{{ line }}</div>
          <div ref="logBottom"></div>
        </div>
      </div>

      <v-btn color="primary" :disabled="installing" @click="install()" class="mt-2">
        Install
      </v-btn>
      <v-btn
        color="yellow-lighten-2"
        v-if="askForReconnect"
        @click="requestDevice()"
        class="ml-2 mt-2"
      >
        Reconnect
      </v-btn>
    </div>

    <div class="pb-8 mt-2">
      <v-banner single-line outlined rounded v-if="installProgress === 100">
        <v-icon color="green darken-3">mdi-check</v-icon>
        <div class="my-4">
          <span class="text-body-1 green--text text--darken-3">
            Installed CalyxOS ({{ store.release().version }}) released on
            {{ store.release().date }}.
          </span>
        </div>
      </v-banner>
      <v-banner rounded class="mt-8 pt-1" v-else-if="installProgress !== null">
        <v-banner-text class="text-body-1">
          {{ installStatus }}
        </v-banner-text>
      </v-banner>

      <v-banner single-line outlined rounded class="mt-8" v-else-if="error">
        <v-icon color="red darken-3">mdi-close</v-icon>
        <div class="my-4">
          <span class="text-body-1 red--text text--darken-3">{{ error.message }}</span>
        </div>
      </v-banner>

      <v-banner single-line outlined rounded v-else> </v-banner>
    </div>

    <div class="d-flex justify-space-between flex-row-reverse">
      <v-btn
        color="primary"
        @click="store.nextStep"
        :disabled="installing || installProgress !== 100"
        >Next <v-icon dark right>mdi-arrow-right</v-icon></v-btn
      >
      <v-btn text @click="store.prevStep" :disabled="installing">Back</v-btn>
    </div>
  </v-container>
</template>

<style scoped>
.log-viewer {
  height: calc(10 * 1.5em);
  overflow-y: auto;
  font-family: monospace;
}
.log-line {
  white-space: pre-wrap;
}
</style>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue"
import { store } from "../store"
import { FastbootFlasher, FastbootClient } from "@aepyornis/fastboot.ts"

const installProgress = ref<number | null>(null)
const installStatus = ref("")
const installing = ref(false)
const error = ref<Error | null>(null)
const askForReconnect = ref(false)
const reconnectResolve = ref<(() => void) | null>(null)
const log = ref<string[]>([])

const logViewer = ref<HTMLElement | null>(null)
const logBottom = ref<HTMLElement | null>(null)

let observer: MutationObserver | null = null

onMounted(() => {
  observer = new MutationObserver(() => {
    logBottom.value?.scrollIntoView()
  })

  if (logViewer.value) {
    observer.observe(logViewer.value, { childList: true })
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

async function install() {
  installing.value = true
  error.value = null
  installProgress.value = 0
  installStatus.value = "Installing..."
  askForReconnect.value = false
  log.value = []

  const client = store.client
  if (!client) {
    throw new Error("FastbootClient is not connected")
  }

  const oLogger = client.logger
  client.logger = createLogger()

  client.reconnectUserAction = () => {
    return requestDeviceAndReconnect()
  }

  try {
    const t0 = performance.now()
    const ff = new FastbootFlasher(client, await store.getImage())
    await ff.runFlashAll()
    const t1 = performance.now()
    installStatus.value = `Finished in ${(t1 - t0) / 1000} seconds.`
    installProgress.value = 100
  } catch (e) {
    error.value = e instanceof Error ? e : new Error(String(e))
    throw e
  } finally {
    installing.value = false
    client.logger = oLogger
  }
}

function requestDeviceAndReconnect(): Promise<void> {
  askForReconnect.value = true
  return new Promise<void>((resolve) => {
    reconnectResolve.value = () => resolve()
  })
}

async function requestDevice() {
  try {
    const device = await FastbootClient.requestUsbDevice()
    if (device) {
      askForReconnect.value = false
      reconnectResolve.value?.()
      reconnectResolve.value = null
    }
  } catch (e) {
    error.value = e instanceof Error ? e : new Error(String(e))
    throw e
  }
}

function createLogger() {
  const thisLog = log.value
  return {
    log(message: string) {
      thisLog.push(message)
      window.console.log(message)
    },
  }
}
</script>
