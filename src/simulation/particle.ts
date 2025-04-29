import { Vector2D } from './vector2d'

let nextId = 0

export interface Particle {
	id: number
	position: Vector2D
	velocity: Vector2D
	radius: number
	mass: number
	color: [number, number, number, number]
}

export function createParticle(
	x: number,
	y: number,
	vx: number,
	vy: number,
	radius: number,
	mass: number = 1,
): Particle {
	return {
		id: nextId++,
		position: new Vector2D(x, y),
		velocity: new Vector2D(vx, vy),
		radius: radius,
		mass: mass,
		color: [Math.min(1, Math.abs(vx) * 0.5), Math.min(1, Math.abs(vy) * 0.5), 0.5, 1.0],
	}
}
