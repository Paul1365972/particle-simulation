import { Vector2D } from '../simulation/vector2d'

export class Camera {
	position: Vector2D = new Vector2D(0, 0)
	zoom: number = 1.0
	canvasWidth: number = 1
	canvasHeight: number = 1

	constructor(canvasWidth: number, canvasHeight: number, initialX?: number, initialY?: number) {
		this.canvasWidth = canvasWidth
		this.canvasHeight = canvasHeight
		this.position.x = initialX ?? canvasWidth / 2
		this.position.y = initialY ?? canvasHeight / 2
	}

	setCanvasSize(width: number, height: number): void {
		this.canvasWidth = width
		this.canvasHeight = height
	}

	screenToWorld(screenX: number, screenY: number): Vector2D {
		const canvasCenterX = this.canvasWidth / 2
		const canvasCenterY = this.canvasHeight / 2

		const translatedX = screenX - canvasCenterX
		const translatedY = screenY - canvasCenterY

		const scaledX = translatedX / this.zoom
		const scaledY = translatedY / this.zoom

		const worldX = scaledX + this.position.x
		const worldY = scaledY + this.position.y

		return new Vector2D(worldX, worldY)
	}

	worldToScreen(worldX: number, worldY: number): Vector2D {
		const canvasCenterX = this.canvasWidth / 2
		const canvasCenterY = this.canvasHeight / 2

		const relativeX = worldX - this.position.x
		const relativeY = worldY - this.position.y

		const scaledX = relativeX * this.zoom
		const scaledY = relativeY * this.zoom

		const screenX = scaledX + canvasCenterX
		const screenY = scaledY + canvasCenterY

		return new Vector2D(screenX, screenY)
	}

	pan(screenDeltaX: number, screenDeltaY: number): void {
		this.position.x -= screenDeltaX / this.zoom
		this.position.y -= screenDeltaY / this.zoom
	}

	zoomAt(amount: number, screenX?: number, screenY?: number): void {
		const zoomFactor = Math.pow(1.1, amount)
		const newZoom = this.zoom * zoomFactor

		const minZoom = 0.05
		const maxZoom = 20.0
		const clampedNewZoom = Math.max(minZoom, Math.min(maxZoom, newZoom))

		if (clampedNewZoom === this.zoom) return

		if (screenX !== undefined && screenY !== undefined) {
			const worldPosBeforeZoom = this.screenToWorld(screenX, screenY)

			this.zoom = clampedNewZoom

			const worldPosAfterZoom = this.screenToWorld(screenX, screenY)

			this.position.x += worldPosBeforeZoom.x - worldPosAfterZoom.x
			this.position.y += worldPosBeforeZoom.y - worldPosAfterZoom.y
		} else {
			this.zoom = clampedNewZoom
		}
	}

	getShaderUniforms(): [number, number, number] {
		return [this.position.x, this.position.y, this.zoom]
	}
}
