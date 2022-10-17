import { Socket } from 'socket.io-client'
import { Chronology } from '../../shared/framework/chronology/Chronology'
import { ClientEvent } from '../../shared/framework/communication/client'
import { ID } from '../../shared/framework/id/ID'
import type { Morphable } from '../../shared/framework/morphable/Morphable'
import { Time } from '../../shared/framework/simulation/Time'

export function registerClientEvent<T, E extends Morphable<E>>(
  socket: Socket,
  chronology: Chronology<E>,
  clientEvent: ClientEvent<T, E>
) {
  socket.on(
    clientEvent.name,
    (payload: T & { connectionID: ID }) => {
      console.info('Received message \'' + clientEvent.name + '\' at: ' + Time.current)

      if (typeof(payload.connectionID) !== 'number' || !clientEvent.checkType(payload)) {
        console.warn('Received message is incomplete: ' + JSON.stringify(payload))
        return
      }

      chronology.addTimeStampedLeap(clientEvent.getTimeStampedLeap(payload.connectionID, payload))
    }
  )
}