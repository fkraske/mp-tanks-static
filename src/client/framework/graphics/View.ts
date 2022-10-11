import { Vector2 } from '@/shared/framework/math/Vector2';

export class View {
  public constructor(
    public position: Vector2,
    public zoom: number
  ) { }

  public transform(position: Vector2) {
    return position.subV(this.position).flipY().add(1).div(2).mul(this.zoom)
  }

  public inverseTransform(position: Vector2) {
    return position.div(this.zoom).mul(2).sub(1).flipY().addV(this.position)
  }
}