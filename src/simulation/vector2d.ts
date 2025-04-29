export class Vector2D {
	constructor(
		public x: number = 0,
		public y: number = 0,
	) {}

	clone(): Vector2D {
		return new Vector2D(this.x, this.y)
	}

	add(v: Vector2D): this {
		this.x += v.x
		this.y += v.y
		return this
	}

	sub(v: Vector2D): this {
		this.x -= v.x
		this.y -= v.y
		return this
	}

	scale(s: number): this {
		this.x *= s
		this.y *= s
		return this
	}

	dot(v: Vector2D): number {
		return this.x * v.x + this.y * v.y
	}

	magnitudeSq(): number {
		return this.x * this.x + this.y * this.y
	}

	magnitude(): number {
		return Math.sqrt(this.magnitudeSq())
	}

	normalize(): this {
		const mag = this.magnitude()
		if (mag > 0) {
			this.scale(1 / mag)
		}
		return this
	}

	static distanceSq(v1: Vector2D, v2: Vector2D): number {
		const dx = v1.x - v2.x
		const dy = v1.y - v2.y
		return dx * dx + dy * dy
	}

	static distance(v1: Vector2D, v2: Vector2D): number {
		return Math.sqrt(Vector2D.distanceSq(v1, v2))
	}
}
