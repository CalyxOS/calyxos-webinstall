<template>
    <v-container class="d-flex justify-space-between flex-column flex-grow-1">
        <div class="mt-n4">
            <h6 class="text-h6 pb-4">Installation complete</h6>
              <p class="text-body-1" v-if="$root.$data.release !== null">
                Congratulations! Your {{ ($root.$data.release.name ? $root.$data.release.name : $root.$data.product) }}
                is now running {{ $root.$data.OS_NAME }} {{ $root.$data.release.version }} ({{ $root.$data.release.date }}).
              </p>
        </div>

        <AboutCalyxOS />

        <div class="d-flex justify-space-between mt-4">
            <v-btn text @click="emit('prevStep')">Back</v-btn>
        </div>
    </v-container>
</template>

<style>
.theme--light.v-sheet--outlined {
    border-width: 2px;
}

.theme--light.v-sheet--outlined.v-card--p-highlight {
    border: 2px solid #007cfa !important;
}
</style>

<script>
import AboutCalyxOS from "@/components/AboutCalyxOS.vue";

export default {
    name: "FinishStep",

    props: ["device", "blobStore", "active"],

    inject: ['emit', 'saEvent'],

    components: { AboutCalyxOS },

    watch: {
        active: {
            async handler(newState) {
                if (newState) {
                    this.saEvent("step_finish");
                }
            },
            immediate: true
        },
    },
};
</script>
