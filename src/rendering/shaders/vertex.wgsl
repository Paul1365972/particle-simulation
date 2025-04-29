struct Particle {
    position: vec2<f32>,
    velocity: vec2<f32>,
    radius: f32,
};

@group(0) @binding(0) var<storage, read> particleData: array<Particle>;

struct SceneUniforms {
    canvasSize: vec2<f32>,
    particleRadius_cameraZoom: vec2<f32>,
    cameraOffset_simSize: vec4<f32>,
};
@group(0) @binding(1) var<uniform> ubo: SceneUniforms;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) quad_pos: vec2<f32>,
};

const QUAD_VERTICES = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0, -1.0), vec2<f32>(-1.0,  1.0),
    vec2<f32>(-1.0,  1.0), vec2<f32>( 1.0, -1.0), vec2<f32>( 1.0,  1.0)
);

@vertex
fn main(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
    let particle = particleData[instanceIndex];
    let canvas_width = ubo.canvasSize.x;
    let canvas_height = ubo.canvasSize.y;

    let particle_radius = particle.radius;
    let camera_zoom = ubo.particleRadius_cameraZoom.y;
    let camera_offset = ubo.cameraOffset_simSize.xy;

    let quad_pos = QUAD_VERTICES[vertexIndex % 6u];
    let vertex_offset_world = quad_pos * particle_radius;

    let particle_center_world = particle.position;

    let vertex_pos_world = particle_center_world + vertex_offset_world;

    let world_pos_relative_to_camera = vertex_pos_world - camera_offset;
    let scaled_pos = world_pos_relative_to_camera * camera_zoom;
    let ndc_pos = vec2<f32>(
        scaled_pos.x * (2.0 / canvas_width),
        scaled_pos.y * (-2.0 / canvas_height) // Flip Y
    );

    var output: VertexOutput;
    output.position = vec4<f32>(ndc_pos, 0.0, 1.0);
    let slow = vec4(0.0, 0.0, 1.0, 1.0);
    let fast = vec4(1.0, 0.0, 0.0, 1.0);
    let factor = clamp(length(particleData[instanceIndex].velocity) / 20.0, 0.0, 1.0);
    output.color = mix(slow, fast, factor);
    output.quad_pos = quad_pos;

    return output;
}
