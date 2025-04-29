import { Particle } from './particle'
import { Vector2D } from './vector2d'

export interface SimulationStats {
	totalKineticEnergy: number
	averageKineticEnergy: number
	totalMomentum: Vector2D
	velocityHistogram: number[]
	maxVelocityForHistogram: number
	averageVelocity: number
	speedOfSound: number
}

const HISTOGRAM_BINS = 100

export function calculateStatistics(particles: Particle[]): SimulationStats {
	let totalKE = 0
	let totalVelocity = 0
	let totalMomentum = new Vector2D()
	let maximumVelocity = 0

	const velocities = []
	for (const p of particles) {
		const mass = p.mass
		const vx = p.velocity.x
		const vy = p.velocity.y
		const speedSq = vx * vx + vy * vy
		const velocity = Math.sqrt(speedSq)
		const momentum = velocity * mass
		const ke = 0.5 * mass * speedSq
		velocities.push(momentum)
		maximumVelocity = Math.max(maximumVelocity, velocity)

		totalKE += ke
		totalVelocity += velocity
		totalMomentum.add(p.velocity.clone().scale(mass))
	}

	const avgKE = totalKE / particles.length
	const averageVelocity = totalVelocity / particles.length

	const binWidth = maximumVelocity / HISTOGRAM_BINS
	const histogram = new Array(HISTOGRAM_BINS).fill(0)

	for (const v of velocities) {
		let binIndex = Math.floor(v / binWidth)
		if (binIndex >= HISTOGRAM_BINS) {
			continue
		}
		histogram[binIndex]++
	}

	const adiabaticIndex = 2
	const speedOfSound = Math.sqrt(adiabaticIndex) * Math.sqrt(Math.PI / 2) * averageVelocity

	return {
		totalKineticEnergy: totalKE,
		averageKineticEnergy: avgKE,
		totalMomentum: totalMomentum,
		velocityHistogram: histogram,
		maxVelocityForHistogram: maximumVelocity,
		averageVelocity,
		speedOfSound,
	}
}
