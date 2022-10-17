import { Vector2 } from '@/shared/framework/math/Vector2';

export class View {
  public constructor(
    public worldPosition: Vector2,
    public offset: Vector2,
    public zoom: number
  ) { }

  public transform(position: Vector2) {
    return position.subV(this.worldPosition).flipY().add(1).div(2).mul(this.zoom).addV(this.offset)
  }

  public transformDirection(direction: Vector2) {
    return direction.flipY().div(2).mul(this.zoom)
  }

  public inverseTransform(position: Vector2) {
    return position.subV(this.offset).div(this.zoom).mul(2).sub(1).flipY().addV(this.worldPosition)
  }

  public inverseTransformDirection(direction: Vector2) {
    return direction.div(this.zoom).mul(2).flipY()
  }

  public transformSize(size: number) {
    return size / 2 * this.zoom
  }

  public inverseTransformSize(size: number) {
    return size / this.zoom * 2
  }
}