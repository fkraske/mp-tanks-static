import { io } from 'socket.io-client';
import { createApp } from 'vue';
import { View } from './client/framework/graphics/View';
import App from './client/game/App.vue';
import { Chronology } from './shared/framework/chronology/Chronology';
import { Snapshot } from './shared/framework/chronology/Snapshot';
import { TimeStamped } from './shared/framework/chronology/TimeStamped';
import { IOEvents } from './shared/framework/communication/events';
import type { InputMessage } from './shared/framework/communication/messages';
import { Vector2 } from './shared/framework/math/Vector2';
import { Time } from './shared/framework/simulation/Time';
import type { TurnInputMessage } from './shared/game/communication/communication';
import { PORT } from './shared/game/constants';
import { Game } from './shared/game/state/Game';
import { Player } from './shared/game/state/Player';

const app = createApp(App);
let chronology: Chronology<Game> | null

app.mount('#app');



const canvas = document.getElementById('canvas') as HTMLCanvasElement
const drawCtx = canvas?.getContext('2d')
const view = new View(Vector2.Zero, Math.min(canvas.width, canvas.height))

if (!drawCtx)
  throw new Error('Draw context not found')



let socket = io('http://localhost:' + PORT)
socket.on(
  IOEvents.Builtin.CONNECT,
  () => {
    chronology = new Chronology(new Snapshot<Game>(Time.current, new Game()), 3)
    drawLoop()
    registerInput()

    socket.emit(
      IOEvents.CUSTOM,
      new TimeStamped<TurnInputMessage>(
        Time.current,
        { inputTime: Time.current, direction: 0 }
      )
    )
  }
)
socket.on(
  IOEvents.Builtin.DISCONNECT,
  () => {
    chronology = null
    deregisterInput()
  }
)
  
  
  
//TODO set canvas aspect ratio

function drawLoop() {
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
  
  drawCtx!.fillStyle = '#ddd'
  drawCtx!.fillRect(0, 0, view.zoom, view.zoom)

  drawPlayer(frame.state.player1)
  drawPlayer(frame.state.player2)
}

function drawPlayer(player: Player) {
  const position = view.transform(player.position)
  const pr = Player.Radius * view.zoom
  
  drawCtx!.ellipse(
    position.x, position.y,
    pr, pr,
    0,
    0, 2 * Math.PI
  )
  drawCtx!.fillStyle = '#000'
  drawCtx!.fill()

  const cannonOffset = position.addV(Vector2.fromAngle(player.angle).mul(Player.CannonLength * view.zoom))
  drawCtx!.lineWidth = Player.Radius * 0.5 * view.zoom
  drawCtx!.beginPath()
  drawCtx!.moveTo(position.x, position.y)
  drawCtx!.lineTo(cannonOffset.x, cannonOffset.y)
  drawCtx!.closePath()
  drawCtx!.strokeStyle = '#000'
  drawCtx!.stroke()
}

function registerInput() {
  //TODO implement
}

function deregisterInput() {
  //TODO implement
}
