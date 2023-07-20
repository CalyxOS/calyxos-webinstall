<template>
    <v-container class="d-flex justify-space-between flex-column flex-grow-1">
        <div class="mt-n4">
            <h6 class="text-h6 pb-4">Installation complete</h6>

            <div class="text-body-1" v-if="$root.$data.release !== null">
                <p>
                    Congratulations! Your
                    {{ $root.$data.product }} is now running
                    {{ $root.$data.OS_NAME }} {{ $root.$data.release.version }}.
                </p>
            </div>
        </div>

        <div class="d-flex justify-space-between">
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

export default {
    name: "FinishStep",

    props: ["device", "blobStore", "active"],
    
    inject: ['emit', 'saEvent'],

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
