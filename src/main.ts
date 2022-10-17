import { io } from 'socket.io-client';
import { createApp } from 'vue';
import { View } from './client/framework/graphics/View';
import App from './client/game/App.vue';
import { Chronology } from './shared/framework/chronology/Chronology';
import { Snapshot } from './shared/framework/chronology/Snapshot';
import * as ClientEvents from './shared/game/communication/client';
import * as IOEvents from './shared/framework/communication/socket-io';
import * as ServerEvents from './shared/framework/communication/server';
import { Vector2 } from './shared/framework/math/Vector2';
import { Time } from './shared/framework/simulation/Time';
import { ActiveState } from './shared/game/communication/model/ActiveState';
import { MoveDirection } from './shared/game/communication/model/MoveDirection';
import { MoveDirectionState } from './shared/game/communication/model/MoveDirectionState';
import { TurnDirection } from './shared/game/communication/model/TurnDirection';
import { TurnDirectionState } from './shared/game/communication/model/TurnDirectionState';
import { PORT } from './shared/game/constants';
import { Game } from './shared/game/state/Game';
import { Player } from './shared/game/state/Player';
import { TimeStamped } from './shared/framework/chronology/TimeStamped';
import type { Leap } from './shared/framework/chronology/Leap';



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
  IOEvents.CONNECT,
  () => {
    chronology = new Chronology(new Snapshot<Game>(Time.current, new Game()))
    drawLoop()
    registerInput()
  }
)
socket.on(
  IOEvents.DISCONNECT,
  () => {
    chronology = null
    deregisterInput()
  }
)
socket.on(
  ServerEvents.LEAP,
  (leap: TimeStamped<Leap<Game>>) => { chronology?.addTimeStampedLeap(leap) }
)
socket.on(
  ServerEvents.UPDATE_ROOT,
  (snapshot: Snapshot<Game>) => { chronology?.updateRoot(snapshot) }
)



//TODO set canvas aspect ratio

function drawLoop() {
  if (!chronology)
    return

  Time.update()
  let frame = chronology.get(Time.frame)

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

  window.requestAnimationFrame(drawLoop)
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
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
}

function deregisterInput() {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
}

function handleKeyDown(ev: KeyboardEvent) {
  const time = Time.current

  switch (ev.key) {
    case 'w':
      chronology?.addLeap(time, g => g.addPlayerMoveInput(0, new MoveDirectionState(MoveDirection.Up, ActiveState.Active)))
      socket.emit(ClientEvents.MoveUpStart.name, { inputTime: time })
      break
    case 'd':
      chronology?.addLeap(time, g => g.addPlayerMoveInput(0, new MoveDirectionState(MoveDirection.Right, ActiveState.Active)))
      socket.emit(ClientEvents.MoveRightStart.name, { inputTime: time })
      break
    case 's':
      chronology?.addLeap(time, g => g.addPlayerMoveInput(0, new MoveDirectionState(MoveDirection.Down, ActiveState.Active)))
      socket.emit(ClientEvents.MoveDownStart.name, { inputTime: time })
      break
    case 'a':
      chronology?.addLeap(time, g => g.addPlayerMoveInput(0, new MoveDirectionState(MoveDirection.Left, ActiveState.Active)))
      socket.emit(ClientEvents.MoveLeftStart.name, { inputTime: time })
      break
    case 'ArrowRight':
      chronology?.addLeap(time, g => g.addPlayerTurnInput(0, new TurnDirectionState(TurnDirection.Clockwise, ActiveState.Active)))
      socket.emit(ClientEvents.TurnClockwiseStart.name, { inputTime: time })
      break
    case 'ArrowLeft':
      chronology?.addLeap(time, g => g.addPlayerTurnInput(0, new TurnDirectionState(TurnDirection.CounterClockwise, ActiveState.Active)))
      socket.emit(ClientEvents.TurnCounterClockwiseStart.name, { inputTime: time })
      break
    default:
  }
}

function handleKeyUp(ev: KeyboardEvent) {
  const time = Time.current

  switch (ev.key) {
    case 'w':
      chronology?.addLeap(time, g => g.addPlayerMoveInput(0, new MoveDirectionState(MoveDirection.Up, ActiveState.Inactive)))
      socket.emit(ClientEvents.MoveUpEnd.name, { inputTime: time })
      break
    case 'd':
      chronology?.addLeap(time, g => g.addPlayerMoveInput(0, new MoveDirectionState(MoveDirection.Right, ActiveState.Inactive)))
      socket.emit(ClientEvents.MoveRightEnd.name, { inputTime: time })
      break
    case 's':
      chronology?.addLeap(time, g => g.addPlayerMoveInput(0, new MoveDirectionState(MoveDirection.Down, ActiveState.Inactive)))
      socket.emit(ClientEvents.MoveDownEnd.name, { inputTime: time })
      break
    case 'a':
      chronology?.addLeap(time, g => g.addPlayerMoveInput(0, new MoveDirectionState(MoveDirection.Left, ActiveState.Inactive)))
      socket.emit(ClientEvents.MoveLeftEnd.name, { inputTime: time })
      break
    case 'ArrowRight':
      chronology?.addLeap(time, g => g.addPlayerTurnInput(0, new TurnDirectionState(TurnDirection.Clockwise, ActiveState.Inactive)))
      socket.emit(ClientEvents.TurnClockwiseEnd.name, { inputTime: time })
      break
    case 'ArrowLeft':
      chronology?.addLeap(time, g => g.addPlayerTurnInput(0, new TurnDirectionState(TurnDirection.CounterClockwise, ActiveState.Inactive)))
      socket.emit(ClientEvents.TurnCounterClockwiseEnd.name, { inputTime: time })
      break
    default:
  }
}