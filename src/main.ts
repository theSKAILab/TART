import './registerServiceWorker'
// import 'es6-promise/auto'
import 'quasar/src/css/index.sass'

import { createApp } from 'vue'
import { createStore } from 'vuex'
import { Quasar } from 'quasar'
import App from './App.vue'
import mitt from 'mitt'
import quasarUserOptions from './quasar-user-options'
import store from './store'

const app = createApp(App).use(Quasar, quasarUserOptions).use(createStore(store))

app.config.globalProperties.emitter = mitt()

app.mount('#app')
