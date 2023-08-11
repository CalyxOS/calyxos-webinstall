import App from "./App.vue";

import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import * as labsComponents from 'vuetify/labs/components'
import * as Sentry from "@sentry/vue";
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { Integrations } from "@sentry/tracing";
import 'vuetify/styles'

const vuetify = createVuetify({
    components: {
      ...components,
      ...labsComponents,
    },
    directives
})

const app = createApp(App).use(vuetify).mount('#app')

if (
    import.meta.env.VITE_SENTRY_DSN !== undefined &&
    import.meta.env.NODE_ENV === "production"
) {
    Sentry.init({
        app,
        dsn: process.env.VITE_SENTRY_DSN,
        integrations: [new Integrations.BrowserTracing()],
        tracesSampleRate: 1.0,
        attachProps: true,
        logErrors: true,
    });
}
