export * from '../shared/game/constants'

export const INTEPROLATION_DURATION = 0.15

export class PlayerDisplay {
  public constructor(
    public readonly style: string,
    public readonly name: string
  ) { }
}

export namespace Players {
  export const ORANGE = new PlayerDisplay('#c53', 'Orange')
  export const BLUE = new PlayerDisplay('#37b', 'Blue')
}