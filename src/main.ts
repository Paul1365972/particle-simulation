import './style.css'
import { ParticleSimulation } from './simulation/simulation'
import { WebGPURenderer } from './rendering/renderer'
import { Camera } from './rendering/camera'

import { calculateStatistics, SimulationStats } from './simulation/statistics'

const PARTICLE_COUNT = 10000
const PARTICLE_RADIUS = 1
const SIMULATION_WIDTH = 1000
const SIMULATION_HEIGHT = 1000
const MOUSE_INTERACTION_RADIUS = 30
const STATS_UPDATE_INTERVAL = 10

const simCanvas = document.getElementById('simulationCanvas') as HTMLCanvasElement
const statsCanvas = document.getElementById('statsCanvas') as HTMLCanvasElement
const appElement = document.getElementById('app') as HTMLDivElement
const pauseIndicator = document.getElementById('pauseIndicator')

if (!simCanvas || !statsCanvas || !appElement) throw new Error('Canvas elements not found!')

let simulation: ParticleSimulation | null = null
let renderer: WebGPURenderer | null = null
let camera: Camera | null = null
let statsCtx: CanvasRenderingContext2D | null = null
let lastStatsUpdateTime = 0
let currentStats: SimulationStats | null = null
let initialized = false
let isPaused = false
let totalTime = 0.0

let isLeftDragging = false
let isRightDragging = false
let lastMouseX = 0
let lastMouseY = 0
let currentMouseDx = 0
let currentMouseDy = 0

function handleResize() {
	if (!appElement || !simCanvas || !statsCanvas || !camera) return

	const displayWidth = appElement.clientWidth
	const displayHeight = appElement.clientHeight

	if (simCanvas.width !== displayWidth || simCanvas.height !== displayHeight) {
		simCanvas.width = displayWidth
		simCanvas.height = displayHeight
		statsCanvas.width = displayWidth
		statsCanvas.height = displayHeight
		console.log(`Canvases resized to: ${displayWidth}x${displayHeight}`)

		camera.setCanvasSize(displayWidth, displayHeight)

		if (renderer && simulation && initialized) {
			renderer.updateParticles(simulation.getParticles())
			renderer.render()
			if (statsCtx && currentStats) {
				drawStatisticsOverlay(currentStats)
			}
		}
	}
}

async function setup() {
	handleResize()

	statsCtx = statsCanvas.getContext('2d')
	if (!statsCtx) {
		console.error('Failed to get 2D context for stats canvas')
	}

	camera = new Camera(
		simCanvas.width,
		simCanvas.height,
		SIMULATION_WIDTH / 2,
		SIMULATION_HEIGHT / 2,
	)

	simulation = new ParticleSimulation(
		SIMULATION_WIDTH,
		SIMULATION_HEIGHT,
		PARTICLE_COUNT,
		PARTICLE_RADIUS,
	)
	renderer = new WebGPURenderer(simCanvas, camera, SIMULATION_WIDTH, SIMULATION_HEIGHT)

	initialized = await renderer.initialize(PARTICLE_COUNT)

	if (initialized) {
		console.log('Simulation and Renderer Initialized')

		window.addEventListener('resize', handleResize)
		addMouseListeners()
		addKeyboardListeners()

		handleResize()
		requestAnimationFrame(animate)
	} else {
		console.error('Initialization failed.')
	}
}

function drawStatisticsOverlay(stats: SimulationStats) {
	if (!statsCtx || !statsCanvas) return

	const ctx = statsCtx
	const canvasWidth = statsCanvas.width
	const canvasHeight = statsCanvas.height

	ctx.clearRect(0, 0, canvasWidth, canvasHeight)

	const histogramData = stats.velocityHistogram
	const numBins = histogramData.length
	if (numBins === 0) return

	const histWidth = canvasWidth * 0.25
	const histHeight = canvasHeight * 0.2
	const histX = canvasWidth - histWidth - 30
	const histY = canvasHeight - histHeight - 30

	const barWidth = histWidth / numBins
	const maxCount = Math.max(1, ...histogramData)

	ctx.save()

	ctx.fillStyle = '#ccc'
	ctx.font = '20px sans-serif'
	ctx.textAlign = 'right'
	const momentumFormat = new Intl.NumberFormat('en-US', {
		signDisplay: 'exceptZero',
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
		useGrouping: false,
	})
	ctx.fillText(`Total Time: ${totalTime.toFixed(2)} s`, canvasWidth - 10, 25)
	ctx.fillText(
		`Average KE: ${stats.averageKineticEnergy.toFixed(8)} m*units^2/s^2`,
		canvasWidth - 10,
		50,
	)
	ctx.fillText(
		`Total KE: ${stats.totalKineticEnergy.toFixed(8)} m*units^2/s^2`,
		canvasWidth - 10,
		75,
	)
	ctx.fillText(
		`Total Momentum DX: ${momentumFormat.format(stats.totalMomentum.x)} m*units/s`,
		canvasWidth - 10,
		100,
	)
	ctx.fillText(
		`Total Momentum DY: ${momentumFormat.format(stats.totalMomentum.y)} m*units/s`,
		canvasWidth - 10,
		125,
	)
	ctx.fillText(
		`Average Velocity: ${stats.averageVelocity.toFixed(3)} units/s`,
		canvasWidth - 10,
		150,
	)
	ctx.fillText(
		`Expected Speed of Sound: ${stats.speedOfSound.toFixed(3)} units/s`,
		canvasWidth - 10,
		175,
	)

	ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
	ctx.fillRect(histX - 5, histY - 20, histWidth + 10, histHeight + 25)

	ctx.fillStyle = '#ccc'
	ctx.font = '15px sans-serif'
	ctx.textAlign = 'center'
	ctx.fillText('Velocity Distribution', histX + histWidth / 2, histY - 10)

	ctx.fillStyle = '#f7a046'
	for (let i = 0; i < numBins; i++) {
		const barHeight = (histogramData[i] / maxCount) * histHeight
		const barX = histX + i * barWidth
		const barY = histY + histHeight - barHeight

		ctx.fillRect(barX, barY, barWidth - 1, barHeight)
	}

	ctx.strokeStyle = '#aaa'
	ctx.lineWidth = 1
	ctx.beginPath()
	ctx.moveTo(histX, histY)
	ctx.lineTo(histX, histY + histHeight)
	ctx.lineTo(histX + histWidth, histY + histHeight)
	ctx.stroke()

	ctx.fillStyle = '#ccc'
	ctx.textAlign = 'center'
	ctx.fillText(stats.maxVelocityForHistogram.toFixed(0), histX + histWidth, histY + histHeight + 15)
	ctx.fillText('0', histX, histY + histHeight + 15)

	ctx.restore()
}

function addMouseListeners() {
	if (!appElement || !camera || !simulation) return
	appElement.addEventListener('contextmenu', (e) => e.preventDefault())
	appElement.addEventListener('mousedown', (e) => {
		if (e.button === 0) {
			isLeftDragging = true
			appElement.style.cursor = 'grabbing'
		} else if (e.button === 2) {
			isRightDragging = true
			appElement.style.cursor = 'move'
		}
		lastMouseX = e.clientX
		lastMouseY = e.clientY
		currentMouseDx = 0
		currentMouseDy = 0
	})
	appElement.addEventListener('mousemove', (e) => {
		const dx = e.clientX - lastMouseX
		const dy = e.clientY - lastMouseY
		if (isRightDragging) {
			camera?.pan(dx, dy)
		}
		if (isLeftDragging) {
			currentMouseDx = dx
			currentMouseDy = dy
		}
		lastMouseX = e.clientX
		lastMouseY = e.clientY
	})
	const handleMouseUpOrLeave = (e?: MouseEvent) => {
		if (e === undefined || e.button === 0) {
			isLeftDragging = false
		}
		if (e === undefined || e.button === 2) {
			isRightDragging = false
		}
		if (!isLeftDragging && !isRightDragging) {
			appElement.style.cursor = 'grab'
		}
		currentMouseDx = 0
		currentMouseDy = 0
	}
	appElement.addEventListener('mouseup', handleMouseUpOrLeave)
	appElement.addEventListener('mouseleave', () => handleMouseUpOrLeave())
	appElement.addEventListener(
		'wheel',
		(e) => {
			e.preventDefault()
			const delta = -Math.sign(e.deltaY)
			camera?.zoomAt(delta, e.clientX, e.clientY)
		},
		{ passive: false },
	)
	appElement.style.cursor = 'grab'
}

function addKeyboardListeners() {
	window.addEventListener('keydown', (e) => {
		if (e.code === 'Space') {
			e.preventDefault()
			isPaused = !isPaused
			console.log(`Simulation ${isPaused ? 'Paused' : 'Resumed'}`)
			if (pauseIndicator) {
				pauseIndicator.style.display = isPaused ? 'block' : 'none'
			}
		}
	})
}

function animate(currentTime: number) {
	if (!initialized || !simulation || !renderer || !camera) {
		requestAnimationFrame(animate)
		return
	}

	const deltaTime = 1.0 / 60

	if (isLeftDragging && !isPaused) {
		const worldDx = currentMouseDx / camera.zoom
		const worldDy = currentMouseDy / camera.zoom
		const rect = simCanvas.getBoundingClientRect()
		const canvasMouseX = lastMouseX - rect.left
		const canvasMouseY = lastMouseY - rect.top
		const worldPos = camera.screenToWorld(canvasMouseX, canvasMouseY)

		simulation.applyForceNearPoint(
			worldPos.x,
			worldPos.y,
			MOUSE_INTERACTION_RADIUS / camera.zoom,
			worldDx,
			worldDy,
		)
	}
	currentMouseDx = 0
	currentMouseDy = 0

	if (!isPaused) {
		simulation.update(deltaTime)
		totalTime += deltaTime
	}

	if (currentTime - lastStatsUpdateTime > STATS_UPDATE_INTERVAL) {
		currentStats = calculateStatistics(simulation.getParticles())
		drawStatisticsOverlay(currentStats)
		lastStatsUpdateTime = currentTime
	}

	renderer.updateParticles(simulation.getParticles())
	renderer.render()

	requestAnimationFrame(animate)
}

setup()
