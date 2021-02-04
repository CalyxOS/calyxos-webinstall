<template>
    <v-container>
        <div class="mb-10 mt-n4">
            <h6 class="text-h6 pb-4">Choose an install type</h6>

            <div class="text-body-1">
                <p>
                    This installer can help you update from an older version of
                    {{ $root.$data.OS_NAME }} or switch to it from another OS,
                    but you need to choose which one you want.
                </p>
            </div>

            <div class="d-flex flex-wrap justify-space-around">
                <v-card
                    outlined
                    max-width="16rem"
                    class="ma-4 d-flex flex-column justify-space-between"
                    ripple
                    :color="
                        $root.$data.installType === 'clean'
                            ? 'grey lighten-2'
                            : null
                    "
                    @click="$root.$data.installType = 'clean'"
                >
                    <div>
                        <v-card-title class="mt-n2">
                            <v-icon
                                class="pr-2 py-2"
                                color="rgba(0, 0, 0, 0.87)"
                                >mdi-cellphone-erase</v-icon
                            >
                            Clean install</v-card-title
                        >
                        <v-card-subtitle
                            >Switch from the stock OS or another ROM to
                            {{ $root.$data.OS_NAME }}.
                            <strong class="red--text text--darken-2"
                                >All data on your device will be lost.</strong
                            >
                        </v-card-subtitle>
                    </div>
                </v-card>

                <v-card
                    outlined
                    max-width="16rem"
                    class="ma-4 d-flex flex-column justify-space-between"
                    ripple
                    :color="
                        $root.$data.installType === 'update'
                            ? 'grey lighten-2'
                            : null
                    "
                    @click="$root.$data.installType = 'update'"
                >
                    <div>
                        <v-card-title class="mt-n2">
                            <v-icon
                                class="pr-2 py-2"
                                color="rgba(0, 0, 0, 0.87)"
                                >mdi-update</v-icon
                            >
                            Update</v-card-title
                        >
                        <v-card-subtitle
                            >Update from an older version of
                            {{ $root.$data.OS_NAME }}. Your data won’t be
                            affected.
                        </v-card-subtitle>
                    </div>
                </v-card>
            </div>
        </div>

        <div class="d-flex justify-space-between flex-row-reverse">
            <v-btn
                color="primary"
                @click="$emit('nextStep')"
                :disabled="$root.$data.installType === null"
                >Next <v-icon dark right>mdi-arrow-right</v-icon></v-btn
            >
            <v-btn text @click="$emit('prevStep')">Back</v-btn>
        </div>
    </v-container>
</template>

<style>
.theme--light.v-sheet--outlined.v-card--selected {
    border: ;
}
</style>

<script>
export default {
    name: "InstallTypeStep",

    props: ["device", "blobStore", "active"],

    data: () => ({
        curStep: 1,
    }),

    methods: {
        async download() {},
    },
};
</script>