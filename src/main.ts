import "./assets/main.css"

import * as components from "vuetify/components"
import * as directives from "vuetify/directives"
import * as labsComponents from "vuetify/labs/components"
import { createApp } from "vue"
import { createVuetify } from "vuetify"

import App from "./App.vue"

const vuetify = createVuetify({
  components: {
    ...components,
    ...labsComponents,
  },
  directives,
})

const app = createApp(App)

app.use(vuetify)

app.mount("#app")
