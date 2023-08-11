import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'

const app = createApp()

const vuetify = createVuetify(
    components,
    directives,
)

app.use(vuetify)

