import { Particle } from '../simulation/particle'
import { Camera } from './camera'
import particleVertexShaderCode from './shaders/particle_vertex.wgsl?raw'
import particleFragmentShaderCode from './shaders/particle_fragment.wgsl?raw'
import borderVertexShaderCode from './shaders/border_vertex.wgsl?raw'
import borderFragmentShaderCode from './shaders/border_fragment.wgsl?raw'

export class WebGPURenderer {
	private canvas: HTMLCanvasElement
	private adapter: GPUAdapter | null = null
	private device: GPUDevice | null = null
	private context: GPUCanvasContext | null = null
	private presentationFormat: GPUTextureFormat | null = null

	private particlePipeline: GPURenderPipeline | null = null
	private particleBuffer: GPUBuffer | null = null
	private particleData: Float32Array | null = null
	private particleUniformBuffer: GPUBuffer | null = null
	private particleBindGroup: GPUBindGroup | null = null

	private borderPipeline: GPURenderPipeline | null = null
	private borderVertexBuffer: GPUBuffer | null = null
	private borderBindGroup: GPUBindGroup | null = null

	private numParticles: number = 0
	private camera: Camera
	private readonly simulationWidth: number
	private readonly simulationHeight: number

	constructor(canvas: HTMLCanvasElement, camera: Camera, simWidth: number, simHeight: number) {
		this.canvas = canvas
		this.camera = camera
		this.simulationWidth = simWidth
		this.simulationHeight = simHeight
	}

	async initialize(numParticles: number): Promise<boolean> {
		this.numParticles = numParticles

		if (!navigator.gpu) {
			return false
		}
		this.adapter = await navigator.gpu.requestAdapter()
		if (!this.adapter) {
			return false
		}
		this.device = await this.adapter.requestDevice()
		if (!this.device) {
			return false
		}
		this.context = this.canvas.getContext('webgpu')
		if (!this.context) {
			return false
		}
		this.presentationFormat = navigator.gpu.getPreferredCanvasFormat()
		this.context.configure({
			device: this.device,
			format: this.presentationFormat,
			alphaMode: 'opaque',
		})

		const particleBufferSize = this.numParticles * 8 * Float32Array.BYTES_PER_ELEMENT
		this.particleBuffer = this.device.createBuffer({
			size: particleBufferSize,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		})
		this.particleData = new Float32Array(this.numParticles * 8)
		const particleUniformBufferSize = 8 * Float32Array.BYTES_PER_ELEMENT
		this.particleUniformBuffer = this.device.createBuffer({
			size: particleUniformBufferSize,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		})
		const particleVertexModule = this.device.createShaderModule({ code: particleVertexShaderCode })
		const particleFragmentModule = this.device.createShaderModule({
			code: particleFragmentShaderCode,
		})
		const particlePipelineLayout = this.device.createPipelineLayout({
			bindGroupLayouts: [
				this.device.createBindGroupLayout({
					entries: [
						{
							binding: 0,
							visibility: GPUShaderStage.VERTEX,
							buffer: { type: 'read-only-storage' },
						},
						{
							binding: 1,
							visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
							buffer: { type: 'uniform' },
						},
					],
				}),
			],
		})
		this.particlePipeline = this.device.createRenderPipeline({
			layout: particlePipelineLayout,
			vertex: { module: particleVertexModule, entryPoint: 'main' },
			fragment: {
				module: particleFragmentModule,
				entryPoint: 'main',
				targets: [{ format: this.presentationFormat }],
			},
			primitive: { topology: 'triangle-list' },
		})
		this.particleBindGroup = this.device.createBindGroup({
			layout: this.particlePipeline.getBindGroupLayout(0),
			entries: [
				{ binding: 0, resource: { buffer: this.particleBuffer } },
				{ binding: 1, resource: { buffer: this.particleUniformBuffer } },
			],
		})

		const borderVerts = new Float32Array([
			0,
			0,
			this.simulationWidth,
			0,
			this.simulationWidth,
			this.simulationHeight,
			0,
			this.simulationHeight,
			0,
			0,
		])
		this.borderVertexBuffer = this.device.createBuffer({
			size: borderVerts.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
			mappedAtCreation: true,
		})
		new Float32Array(this.borderVertexBuffer.getMappedRange()).set(borderVerts)
		this.borderVertexBuffer.unmap()

		const borderVertexModule = this.device.createShaderModule({ code: borderVertexShaderCode })
		const borderFragmentModule = this.device.createShaderModule({ code: borderFragmentShaderCode })
		const borderPipelineLayout = particlePipelineLayout
		this.borderPipeline = this.device.createRenderPipeline({
			layout: borderPipelineLayout,
			vertex: {
				module: borderVertexModule,
				entryPoint: 'main',
				buffers: [
					{
						arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
						attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
					},
				],
			},
			fragment: {
				module: borderFragmentModule,
				entryPoint: 'main',
				targets: [{ format: this.presentationFormat }],
			},
			primitive: { topology: 'line-strip' },
		})
		this.borderBindGroup = this.device.createBindGroup({
			layout: this.borderPipeline.getBindGroupLayout(0),
			entries: [
				{ binding: 0, resource: { buffer: this.particleBuffer } },
				{ binding: 1, resource: { buffer: this.particleUniformBuffer } },
			],
		})

		return true
	}

	updateParticles(particles: Particle[]): void {
		if (!this.device || !this.particleData || !this.particleBuffer) return
		for (let i = 0; i < this.numParticles; i++) {
			const p = particles[i]
			if (!p) continue
			this.particleData[i * 6 + 0] = p.position.x
			this.particleData[i * 6 + 1] = p.position.y
			this.particleData[i * 6 + 2] = p.velocity.x
			this.particleData[i * 6 + 3] = p.velocity.y
			this.particleData[i * 6 + 4] = p.radius
		}
		this.device.queue.writeBuffer(this.particleBuffer, 0, this.particleData)
	}

	render(): void {
		if (
			!this.device ||
			!this.context ||
			!this.particlePipeline ||
			!this.borderPipeline ||
			!this.presentationFormat ||
			!this.particleBindGroup ||
			!this.borderBindGroup ||
			!this.particleUniformBuffer ||
			!this.borderVertexBuffer
		) {
			return
		}

		const [camX, camY, camZoom] = this.camera.getShaderUniforms()
		const uniformData = new Float32Array([
			this.canvas.width,
			this.canvas.height,
			camZoom,
			0,
			camX,
			camY,
			this.simulationWidth,
			this.simulationHeight,
		])
		this.device.queue.writeBuffer(this.particleUniformBuffer, 0, uniformData)

		const textureView = this.context.getCurrentTexture().createView()
		const commandEncoder = this.device.createCommandEncoder()
		const renderPassDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [
				{
					view: textureView,
					loadOp: 'clear',
					clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
					storeOp: 'store',
				},
			],
		}
		const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)

		passEncoder.setPipeline(this.particlePipeline)
		passEncoder.setBindGroup(0, this.particleBindGroup)
		passEncoder.draw(6, this.numParticles, 0, 0)

		passEncoder.setPipeline(this.borderPipeline)
		passEncoder.setBindGroup(0, this.borderBindGroup)
		passEncoder.setVertexBuffer(0, this.borderVertexBuffer)
		passEncoder.draw(5, 1, 0, 0)

		passEncoder.end()
		this.device.queue.submit([commandEncoder.finish()])
	}
}
