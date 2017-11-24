export function clamp(x: number, minVal: number, maxVal: number) {
  if (x < minVal) return minVal
  if (x > maxVal) return maxVal
  return x
}

export class Vec2 {
  constructor(readonly x = 0, readonly y = 0) {}
  withX(x: number) { return new Vec2(x, this.y) }
  withY(y: number) { return new Vec2(this.x, y) }

  plus(other: Vec2) { return new Vec2(this.x + other.x, this.y + other.y) }
  minus(other: Vec2) { return new Vec2(this.x - other.x, this.y - other.y) }
  times(scalar: number) { return new Vec2(this.x * scalar, this.y * scalar) }
  timesPointwise(other: Vec2) { return new Vec2(this.x * other.x, this.y * other.y) }
  dot(other: Vec2) { return this.x * other.x + this.y * other.y }
  length2() { return this.dot(this) }
  length() { return Math.sqrt(this.length2()) }

  static min(a: Vec2, b: Vec2) {
    return new Vec2(Math.min(a.x, b.x), Math.min(a.y, b.y))
  }

  static max(a: Vec2, b: Vec2) {
    return new Vec2(Math.max(a.x, b.x), Math.max(a.y, b.y))
  }

  flatten(): [number, number] { return [this.x, this.y] }
}

export class AffineTransform {
  constructor(
    readonly m00 = 1, readonly m01 = 0, readonly m02 = 0,
    readonly m10 = 0, readonly m11 = 1, readonly m12 = 0
  ) {}

  withScale(s: Vec2) {
    let {
      m00, m01, m02,
      m10, m11, m12
    } = this
    m00 = s.x
    m11 = s.y
    return new AffineTransform(m00, m01, m02, m10, m11, m12)
  }
  static withScale(s: Vec2) {
    return (new AffineTransform).withScale(s)
  }
  getScale() { return new Vec2(this.m00, this.m11) }

  withTranslation(t: Vec2) {
    let {
      m00, m01, m02,
      m10, m11, m12
    } = this
    m02 = t.x
    m12 = t.y
    return new AffineTransform(m00, m01, m02, m10, m11, m12)
  }
  static withTranslation(t: Vec2) {
    return (new AffineTransform).withTranslation(t)
  }
  getTranslation() { return new Vec2(this.m02, this.m12) }

  static betweenRects(from: Rect, to: Rect) {
    return AffineTransform
      .withTranslation(to.origin.minus(from.origin))
      .withScale(new Vec2(
        to.size.x / from.size.x,
        to.size.y / from.size.y
      ))
  }

  times(other: AffineTransform) {
    const m00 = this.m00 * other.m00 + this.m01 * other.m10
    const m01 = this.m00 * other.m01 + this.m01 * other.m11
    const m02 = this.m00 * other.m02 + this.m01 * other.m12 + this.m02

    const m10 = this.m10 * other.m00 + this.m11 * other.m10
    const m11 = this.m10 * other.m01 + this.m11 * other.m11
    const m12 = this.m10 * other.m02 + this.m11 * other.m12 + this.m12
    return new AffineTransform(m00, m01, m02, m10, m11, m12)
  }

  transformVector(v: Vec2) {
    return new Vec2(
      v.x * this.m00 + v.y * this.m01,
      v.x * this.m10 + v.y * this.m11
    )
  }

  transformPosition(v: Vec2) {
    return new Vec2(
      v.x * this.m00 + v.y * this.m01 + this.m02,
      v.x * this.m10 + v.y * this.m11 + this.m12
    )
  }

  flatten(): [number, number, number, number, number, number, number, number, number] {
    // Flatten into GLSL format
    return [
      this.m00, this.m10, 0,
      this.m01, this.m11, 0,
      this.m02, this.m12, 1,
    ]
  }
}

export class Rect {
  constructor(
    readonly origin = new Vec2(),
    readonly size = new Vec2()
  ) {}

  width() { return this.size.x }
  height() { return this.size.y }

  left() { return this.origin.x }
  right() { return this.left() + this.width() }
  top() { return this.origin.y }
  bottom() { return this.top() + this.height() }

  topLeft() { return this.origin }
  topRight() { return this.origin.plus(new Vec2(this.width(), 0)) }

  bottomRight() { return this.origin.plus(this.size) }
  bottomLeft() { return this.origin.plus(new Vec2(0, this.height())) }

  withOrigin(origin: Vec2) { return new Rect(origin, this.size) }
  withSize(size: Vec2) { return new Rect(this.origin, size) }

  closestPointTo(p: Vec2) {
    return new Vec2(
      clamp(p.x, this.left(), this.right()),
      clamp(p.y, this.top(), this.bottom())
    )
  }
}