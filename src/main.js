import App from "./App.vue";

import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import * as labsComponents from 'vuetify/labs/components'
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import 'vuetify/styles'

import "@fontsource/roboto"
import "@mdi/font/css/materialdesignicons.css"

const vuetify = createVuetify({
    components: {
      ...components,
      ...labsComponents,
    },
    directives
})

const app = createApp(App).use(vuetify).mount('#app')

if (process.env.NODE_ENV !== 'production' && typeof(window) !== 'undefined') {
  window.$app = app;
}
