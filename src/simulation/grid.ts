import { Particle } from './particle'
import { Vector2D } from './vector2d'

export class SpatialGrid {
	private width!: number
	private height!: number
	private cols!: number
	private rows!: number
	private cellWidth!: number
	private cellHeight!: number
	private grid!: Particle[][]

	constructor(width: number, height: number, cellSize: number) {
		this.resize(width, height, cellSize)
	}

	resize(width: number, height: number, cellSize: number): void {
		this.width = width
		this.height = height
		this.cols = Math.max(1, Math.ceil(width / cellSize))
		this.rows = Math.max(1, Math.ceil(height / cellSize))
		this.cellWidth = this.width / this.cols
		this.cellHeight = this.height / this.rows
		this.grid = Array.from({ length: this.rows * this.cols }, () => [])

		console.log(
			`Grid resized: ${this.cols}x${this.rows} cells, Cell size: ${this.cellWidth.toFixed(2)}x${this.cellHeight.toFixed(2)}`,
		)
	}

	clear(): void {
		for (let i = 0; i < this.grid.length; i++) {
			this.grid[i].length = 0
		}
	}

	insert(particle: Particle): void {
		const col = Math.max(
			0,
			Math.min(this.cols - 1, Math.floor(particle.position.x / this.cellWidth)),
		)
		const row = Math.max(
			0,
			Math.min(this.rows - 1, Math.floor(particle.position.y / this.cellHeight)),
		)
		const index = row * this.cols + col

		this.grid[index].push(particle)
	}

	getPotentialColliders(position: Vector2D): Particle[] {
		const results: Particle[] = []
		const centralCol = Math.max(0, Math.min(this.cols - 1, Math.floor(position.x / this.cellWidth)))
		const centralRow = Math.max(
			0,
			Math.min(this.rows - 1, Math.floor(position.y / this.cellHeight)),
		)

		for (let r = Math.max(0, centralRow - 1); r <= Math.min(this.rows - 1, centralRow + 1); r++) {
			for (let c = Math.max(0, centralCol - 1); c <= Math.min(this.cols - 1, centralCol + 1); c++) {
				const index = r * this.cols + c
				results.push(...this.grid[index])
			}
		}
		return results
	}

	getCellIndex(position: Vector2D): number {
		const col = Math.max(0, Math.min(this.cols - 1, Math.floor(position.x / this.cellWidth)))
		const row = Math.max(0, Math.min(this.rows - 1, Math.floor(position.y / this.cellHeight)))
		return row * this.cols + col
	}
}
