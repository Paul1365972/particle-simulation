import { Particle, createParticle } from './particle'
import { Vector2D } from './vector2d'
import { SpatialGrid } from './grid'

export class ParticleSimulation {
	particles: Particle[] = []
	width: number
	height: number
	grid: SpatialGrid
	private gridCellSize: number

	constructor(width: number, height: number, numParticles: number, particleRadius: number = 2) {
		this.width = width
		this.height = height

		this.gridCellSize = particleRadius * 4
		this.grid = new SpatialGrid(this.width, this.height, this.gridCellSize)

		nextParticle: while (this.particles.length < numParticles) {
			const x = particleRadius + Math.random() * (width - 2 * particleRadius)
			const y = particleRadius + Math.random() * (height - 2 * particleRadius)
			const angle = Math.random() * Math.PI * 2
			const speed = 10
			const vx = Math.cos(angle) * speed
			const vy = Math.sin(angle) * speed
			for (const other of this.particles) {
				if (Vector2D.distance(new Vector2D(x, y), other.position) < particleRadius * 2) {
					continue nextParticle
				}
			}
			this.particles.push(createParticle(x, y, vx, vy, particleRadius))
		}
	}

	resize(newWidth: number, newHeight: number): void {
		console.log(`Simulation resizing to ${newWidth}x${newHeight}`)
		this.width = newWidth
		this.height = newHeight

		this.grid.resize(this.width, this.height, this.gridCellSize)

		for (const p of this.particles) {
			p.position.x = Math.max(p.radius, Math.min(this.width - p.radius, p.position.x))
			p.position.y = Math.max(p.radius, Math.min(this.height - p.radius, p.position.y))
		}
	}

	update(deltaTime: number): void {
		for (const p of this.particles) {
			const delta = p.velocity.clone().scale(deltaTime)
			p.position.add(delta)
			p.freePathDistance += delta.magnitude()
		}

		for (const p of this.particles) {
			if (p.position.x - p.radius < 0) {
				p.position.x = p.radius
				p.velocity.x *= -1
			} else if (p.position.x + p.radius > this.width) {
				p.position.x = this.width - p.radius
				p.velocity.x *= -1
			}

			if (p.position.y - p.radius < 0) {
				p.position.y = p.radius
				p.velocity.y *= -1
			} else if (p.position.y + p.radius > this.height) {
				p.position.y = this.height - p.radius
				p.velocity.y *= -1
			}
		}

		this.grid.clear()
		for (const p of this.particles) {
			this.grid.insert(p)
		}

		for (const p1 of this.particles) {
			const potentialColliders = this.grid.getPotentialColliders(p1.position)

			for (const p2 of potentialColliders) {
				this.resolveCollisionElastic(p1, p2)
			}
		}
	}

	resolveCollisionElastic(p1: Particle, p2: Particle): void {
		if (p1.id >= p2.id) {
			return
		}
		const minDist = p1.radius + p2.radius
		const distSq = Vector2D.distanceSq(p1.position, p2.position)
		if (distSq >= minDist * minDist || distSq < 0.01) {
			return
		}

		const dist = Math.sqrt(distSq)
		const overlap = minDist - dist
		const normal = p2.position
			.clone()
			.sub(p1.position)
			.scale(1.0 / dist)

		const correction = normal.clone().scale(overlap * 0.5)
		p1.position.sub(correction)
		p2.position.add(correction)

		const rv = p2.velocity.clone().sub(p1.velocity)
		const velAlongNormal = rv.dot(normal)

		if (velAlongNormal > 0) {
			return
		}

		const j = -velAlongNormal
		const impulse = normal.clone().scale(j)

		p1.velocity.sub(impulse)
		p2.velocity.add(impulse)

		p1.freePathDistance = 0
		p2.freePathDistance = 0
	}

	applyForceNearPoint(
		worldX: number,
		worldY: number,
		radius: number,
		dx: number,
		dy: number,
	): void {
		const forceCenter = new Vector2D(worldX, worldY)
		const forceDirection = new Vector2D(dx, dy)
		const radiusSq = radius * radius

		for (const p of this.particles) {
			const distSq = Vector2D.distanceSq(p.position, forceCenter)
			if (distSq < radiusSq && distSq > 1e-6) {
				const strength = 1.0
				const velocityChange = forceDirection.clone().scale(strength)
				p.velocity.add(velocityChange)
			}
		}
	}

	getParticles(): Particle[] {
		return this.particles
	}
}
