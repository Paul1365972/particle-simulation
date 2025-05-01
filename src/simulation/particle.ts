import { Vector2D } from './vector2d'

let nextId = 0

export interface Particle {
	id: number
	position: Vector2D
	velocity: Vector2D
	radius: number
	mass: number
	freePathDistance: number
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
		freePathDistance: 0,
	}
}
