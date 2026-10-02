<template>
  <v-container class="d-flex justify-space-between flex-column flex-grow-1">
    <div class="mt-n4">
      <p class="text-headline-small mb-4" v-if="rollbackDowngrade">
        ⚠️ Anti-rollback downgrade detected
      </p>
      <p class="text-headline-small mb-4" v-else>
        Lock the bootloader using the volume buttons on your phone
      </p>

      <v-btn
        color="primary"
        @click="lock"
        v-show="!locked && !locking && !rollbackDowngrade"
        :disabled="locking"
        >Lock</v-btn
      >
    </div>

    <div class="mb-4">
      <v-banner single-line outlined rounded class="mt-4" v-if="locked">
        <v-icon color="green darken-3">mdi-check</v-icon>
        <span class="text-body-1 green--text text--darken-3">Bootloader locked</span>
      </v-banner>
      <v-banner single-line outlined rounded class="mt-4" v-else-if="locking">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <span class="text-body-1">
          Locking bootloader… Confirm using the volume and power buttons.
        </span>
      </v-banner>
      <v-banner single-line outlined rounded class="mt-4" v-else-if="error">
        <v-icon color="red darken-3">mdi-close</v-icon>
        <span class="text-body-1 red--text text--darken-3">{{ error }}</span>
      </v-banner>
      <div class="mt-4" v-else-if="rollbackDowngrade">
        <p>
	  The Anti-Rollback protection has stopped the bootloader relocking of your {{ product }} ({{ serialNumber }}).
        </p>
	<p>
	  CalyxOS has been fully installed. However, the flashed factory image has a lower Anti-Rollback index, <strong>{{ rollbackImageIndex }}</strong>, than the previous OS installed on this device, <strong>{{ rollbackStoredIndex }}</strong>.
	</p>
	<p>
	  Locking the bootloader now will prevent the device from booting. It will stay unlocked.
	  Do not try to lock the bootloader manually when you see this warning.
	</p>
	<p>
	  We recommend that you download and flash a newer factory image to be able to relock the bootloader for maximum security.
	  Visit <a href="https://calyxos.org/motorola-relock">https://calyxos.org/motorola-relock</a> for more information.
	</p>
      </div>
    </div>

    <div class="d-flex justify-space-between flex-row-reverse">
      <v-btn color="primary" @click="store.nextStep" :disabled="!locked && !rollbackDowngrade">
        <span>Finish </span><v-icon dark right>mdi-arrow-right</v-icon>
      </v-btn>
      <v-btn text @click="store.prevStep">Back</v-btn>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { store } from "../store"

const locking = ref(false)
const locked = ref<boolean | null>(null)
const error = ref<string | null>(null)
const product = ref<string>("")
const serialNumber = ref<string>("")
const rollbackDowngrade = ref(false)
const rollbackImageIndex = ref<string | null>(null)
const rollbackStoredIndex = ref<string | null>(null)

async function lock() {
  try {
    locking.value = true
    error.value = null

    const client = store.client
    if (!client) {
      throw new Error("FastbootClient is not connected")
    }

    product.value = await client.getVarCache("product")
    serialNumber.value = client.fd.serialNumber

    if (client.rollbackDowngrade && (await client.isMotorolaProduct())) {
      rollbackDowngrade.value = true
      rollbackImageIndex.value = client.rollbackImageIndex || ""
      rollbackStoredIndex.value = client.rollbackStoredIndex || ""
    } else {
      await client.lock()
      locked.value = true
    }
  } catch (e) {
    console.debug(e)
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    locking.value = false
  }
}

onMounted(async () => {
  await lock()
})
</script>
