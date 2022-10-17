import { io } from 'socket.io-client';
import { createApp } from 'vue';
import * as Constants from './client/constants';
import { registerClientEvent } from './client/framework/events';
import { View } from './client/framework/View';
import App from './client/game/App.vue';
import { Chronology } from './shared/framework/chronology/Chronology';
import { Snapshot } from './shared/framework/chronology/Snapshot';
import type { TimeStamp } from './shared/framework/chronology/TimeStamp';
import * as ServerEvents from './shared/framework/communication/server';
import * as IOEvents from './shared/framework/communication/socket-io';
import { ID } from './shared/framework/id/ID';
import { Vector2 } from './shared/framework/math/Vector2';
import { Time } from './shared/framework/simulation/Time';
import { Utils } from './shared/framework/util/numberUtils';
import * as ClientEvents from './shared/game/communication/client';
import { ActiveState } from './shared/game/communication/model/ActiveState';
import { MoveDirection } from './shared/game/communication/model/MoveDirection';
import { MoveDirectionState } from './shared/game/communication/model/MoveDirectionState';
import { TurnDirection } from './shared/game/communication/model/TurnDirection';
import { TurnDirectionState } from './shared/game/communication/model/TurnDirectionState';
import { PORT } from './shared/game/constants';
import { Bullet } from './shared/game/state/Bullet';
import { Game } from './shared/game/state/Game';
import { Player } from './shared/game/state/Player';



const app = createApp(App);
let chronology = new Chronology<Game>(new Snapshot<Game>(Time.frame, new Game()))
let display = chronology.get(Time.frame)
let lastUpdateTime = Time.frame
let id = -1
let frameID = -1

app.mount('#app');



const canvas = document.getElementById('canvas') as HTMLCanvasElement
const drawCtx = canvas!.getContext('2d')!
const view = new View(
  Vector2.Zero,
  new Vector2(canvas.width, canvas.height).sub(Math.min(canvas.width, canvas.height)).div(2),
  Math.min(canvas.width, canvas.height)
)



let socket = io('http://localhost:' + PORT)
socket.on(
  IOEvents.CONNECT,
  () => {
    frameLoop()
    registerInput()
  }
)
socket.on(
  IOEvents.DISCONNECT,
  () => {
    cancelFrameLoop()
    deregisterInput()
  }
)
socket.on(
  ServerEvents.CONNECTION_ID,
  (connectionID: ID) => {
    console.info('Received ID: ' + connectionID)
    id = connectionID
  }
)
socket.on(
  ServerEvents.INIT,
  (snapshot: Snapshot<Game>) => {
    console.info('Received initialization data')
    snapshot = new Snapshot<Game>(snapshot.timeStamp, Game.cloneDeserialized(snapshot.value))
    lastUpdateTime = Time.current
    display = snapshot
    chronology.clear()
    chronology.updateRoot(snapshot)
  }
)
socket.on(
  ServerEvents.UPDATE_ROOT,
  (snapshot: Snapshot<Game>) => {
    console.info('Received Snapshot')
    snapshot = new Snapshot<Game>(snapshot.timeStamp, Game.cloneDeserialized(snapshot.value))
    lastUpdateTime = Time.current
    chronology.updateRoot(snapshot)
  }
)

for (const ev of ClientEvents.All)
  registerClientEvent<{ inputTime: TimeStamp }, Game>(
    socket,
    chronology,
    ev,
    () => lastUpdateTime = Time.current
  )



function frameLoop() {
  Time.update()
  display.advance(Time.delta)
  display = display.interpolate(
    chronology.get(Time.frame),
    Utils.clamp01((Time.frame - lastUpdateTime) / Constants.INTEPROLATION_DURATION)
  )

  if (canvas.width != Math.floor(canvas.clientWidth)) {
    canvas.width = canvas.clientWidth
    view.zoom = Math.min(canvas.width, canvas.height)
    view.offset = new Vector2(canvas.width, canvas.height).sub(view.zoom).div(2)
  }

  if (canvas.height != Math.floor(canvas.clientHeight)) {
    canvas.height = canvas.clientHeight
    view.zoom = Math.min(canvas.width, canvas.height)
    view.offset = new Vector2(canvas.width, canvas.height).sub(view.zoom).div(2)
  }

  drawCtx.clearRect(0, 0, canvas.width, canvas.height)

  drawCtx.fillStyle = '#ddd'
  drawCtx.fillRect(
    view.offset.x,
    view.offset.y,
    view.zoom,
    view.zoom
  )

  drawPlayer(display.state.player1)
  drawPlayer(display.state.player2)

  frameID = window.requestAnimationFrame(frameLoop)
}

function cancelFrameLoop() {
  if (frameID !== -1)
    window.cancelAnimationFrame(frameID)
}

function drawPlayer(player: Player) {
  const pp = view.transform(player.position)
  const pr = view.transformSize(Player.Radius)
  const pf = view.transformDirection(player.forward)

  //Player base
  drawCtx.beginPath()
  drawCtx.ellipse(
    pp.x, pp.y,
    pr, pr,
    0,
    0, 2 * Math.PI
  )
  drawCtx.closePath()
  drawCtx.fillStyle = '#000'
  drawCtx.fill()

  //Player cannon
  const cannonOffset = pp.addV(pf.mul(Player.CannonLength))
  drawCtx.lineWidth = pr / 2
  drawCtx.beginPath()
  drawCtx.moveTo(pp.x, pp.y)
  drawCtx.lineTo(cannonOffset.x, cannonOffset.y)
  drawCtx.closePath()
  drawCtx.strokeStyle = '#000'
  drawCtx.stroke()

  //Bullet
  if (!player.bullet)
    return

  const bp = view.transform(player.bullet.position)
  const br = view.transformSize(Bullet.Radius)

  drawCtx.beginPath()
  drawCtx.ellipse(
    bp.x, bp.y,
    br, br,
    0,
    0, 2 * Math.PI
  )
  drawCtx.closePath()
  drawCtx.fillStyle = '#000'
  drawCtx.fill()
}

function registerInput() {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
}

function deregisterInput() {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
}

//TODO prevent repeated trigger
//TODO use event stuff instead of duplicate code
function handleKeyDown(ev: KeyboardEvent) {
  const time = Time.current

  let event:
    ClientEvents.ClientMoveEvent |
    ClientEvents.ClientTurnEvent |
    ClientEvents.ClientShootEvent |
    undefined

  switch (ev.key) {
    case 'w':
      event = ClientEvents.MoveUpStart
      break
    case 'd':
      event = ClientEvents.MoveRightStart
      break
    case 's':
      event = ClientEvents.MoveDownStart
      break
    case 'a':
      event = ClientEvents.MoveLeftStart
      break
    case 'ArrowRight':
      event = ClientEvents.TurnClockwiseStart
      break
    case 'ArrowLeft':
      event = ClientEvents.TurnCounterClockwiseStart
      break
    case ' ':
      event = ClientEvents.ShootStart
      break
  }

  if (event === undefined)
    return

  const payload = { inputTime: time }
  const leap = event.getTimeStampedLeap(id, payload)

  chronology.addTimeStampedLeap(leap)
  socket.emit(event.name, payload)

  Time.update()
  display.advance(Time.delta)
  display.leap(leap.value)
}

function handleKeyUp(ev: KeyboardEvent) {
  const time = Time.current

  let event:
    ClientEvents.ClientMoveEvent |
    ClientEvents.ClientTurnEvent |
    ClientEvents.ClientShootEvent |
    undefined

    switch (ev.key) {
      case 'w':
        event = ClientEvents.MoveUpEnd
        break
      case 'd':
        event = ClientEvents.MoveRightEnd
        break
      case 's':
        event = ClientEvents.MoveDownEnd
        break
      case 'a':
        event = ClientEvents.MoveLeftEnd
        break
      case 'ArrowRight':
        event = ClientEvents.TurnClockwiseEnd
        break
      case 'ArrowLeft':
        event = ClientEvents.TurnCounterClockwiseEnd
        break
      case ' ':
        event = ClientEvents.ShootEnd
        break
    }

  if (event === undefined)
    return

  const payload = { inputTime: time }
  const leap = event.getTimeStampedLeap(id, payload)

  chronology.addTimeStampedLeap(leap)
  socket.emit(event.name, payload)
  
  Time.update()
  display.advance(Time.delta)
  display.leap(leap.value)
}