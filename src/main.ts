import { io } from 'socket.io-client';
import { createApp } from 'vue';
import { View } from './client/framework/graphics/View';
import App from './client/game/App.vue';
import { Chronology } from './shared/framework/chronology/Chronology';
import { Snapshot } from './shared/framework/chronology/Snapshot';
import { IOEvents } from './shared/framework/communication/events';
import { Vector2 } from './shared/framework/math/Vector2';
import { Time } from './shared/framework/simulation/Time';
import { Game } from './shared/game/state/Game';
import { Player } from './shared/game/state/Player';

const app = createApp(App);
let chronology: Chronology<Game> /*TODO remove*/ = new Chronology(new Snapshot<Game>(Time.current, new Game()), 3)

app.mount('#app');



const canvas = document.getElementById('canvas') as HTMLCanvasElement
const drawCtx = canvas?.getContext('2d')
const view = new View(Vector2.Zero, Math.min(canvas.width, canvas.height))

if (!drawCtx)
  throw new Error('Draw context not found')



let socket = io('https://localhost')
socket.on(
  IOEvents.Builtin.CONNECTION,
  () => {
    drawGame()
  }
)
  
  
  
//TODO set canvas aspect ratio

function drawGame() {
  if (!chronology)
    return
    
  Time.update()
  let frame = chronology.get(Time.current)
    
  if (canvas.width != Math.floor(canvas.clientWidth)) {
    canvas.width = canvas.clientWidth
    view.zoom = Math.min(canvas.width, canvas.height)
  }
  
  if (canvas.height != Math.floor(canvas.clientHeight)) {
    canvas.height = canvas.clientHeight
    view.zoom = Math.min(canvas.width, canvas.height)
  }

  drawCtx!.clearRect(0, 0, canvas.width, canvas.height)

  let p1p = view.transform(frame.state.player1.position)
  let p2p = view.transform(frame.state.player2.position)
  let pr = Player.Radius * view.zoom

  drawCtx!.ellipse(
    p1p.x, p1p.y,
    pr, pr,
    0,
    0, 2 * Math.PI
  )

  drawCtx!.ellipse(
    p2p.x, p2p.y,
    pr, pr,
    0,
    0, 2 * Math.PI
  )

  drawCtx!.fill()

  window.requestAnimationFrame(drawGame)
}