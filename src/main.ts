import { createApp } from 'vue';
import App from './client/App.vue';
import { Chronology } from './shared/framework/chronology/Chronology';
import { Time } from './shared/framework/simulation/Time';
import { Game } from './shared/game/state/Game';

const app = createApp(App);
let chronology: Chronology<Game>

app.mount('#app');



const canvas = document.getElementById('canvas') as HTMLCanvasElement
const drawCtx = canvas.getContext('2d')

function drawGame() {
  Time.update()
  let frame = chronology.get(Time.current)

  // drawCtx?.ellipse()

  window.requestAnimationFrame(drawGame)
}