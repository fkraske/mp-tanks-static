import { createApp } from "vue";
import App from "./client/App.vue";
import router from "./client/router";

import "./app/assets/main.css";

const app = createApp(App);

app.use(router);

app.mount("#app");
