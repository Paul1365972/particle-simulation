import { Particle } from './particle'
import { Vector2D } from './vector2d'

export interface SimulationStats {
	totalKineticEnergy: number
	averageKineticEnergy: number
	totalMomentum: Vector2D
	momentumHistogram: number[]
	maxMomentumForHistogram: number
}

const HISTOGRAM_BINS = 100

export function calculateStatistics(particles: Particle[]): SimulationStats {
	let totalKE = 0
	let momentumX = 0
	let momentumY = 0

	const energies = []
	const momentums = []
	for (const p of particles) {
		const mass = p.mass
		const vx = p.velocity.x
		const vy = p.velocity.y
		const speedSq = vx * vx + vy * vy
		const momentum = Math.sqrt(speedSq) * mass
		const ke = 0.5 * mass * speedSq
		momentums.push(momentum)
		energies.push(ke)

		totalKE += ke
		momentumX += mass * vx
		momentumY += mass * vy
	}

	const avgKE = totalKE / particles.length
	const totalMomentum = new Vector2D(momentumX, momentumY)

	momentums.sort((a, b) => a - b)

	const maxMomentumForHistogram = momentums[Math.floor(momentums.length * 0.999)]
	const binWidth = maxMomentumForHistogram / HISTOGRAM_BINS
	const histogram = new Array(HISTOGRAM_BINS).fill(0)

	for (const momentum of momentums) {
		let binIndex = Math.floor(momentum / binWidth)
		if (binIndex >= HISTOGRAM_BINS) {
			continue
		}
		histogram[binIndex]++
	}

	return {
		totalKineticEnergy: totalKE,
		averageKineticEnergy: avgKE,
		totalMomentum: totalMomentum,
		momentumHistogram: histogram,
		maxMomentumForHistogram,
	}
}
