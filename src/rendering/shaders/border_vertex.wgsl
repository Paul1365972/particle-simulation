// Uniforms (matching particle shader's binding 1)
struct SceneUniforms {
    canvasSize: vec2<f32>,
    particleRadius_cameraZoom: vec2<f32>, // particleRadius, cameraZoom
    cameraOffset_simSize: vec4<f32>, // cameraX, cameraY, simWidth, simHeight
};
@group(0) @binding(1) var<uniform> ubo: SceneUniforms;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
};

@vertex
fn main(
    @location(0) worldPos: vec2<f32> // Input vertex position (world coords)
) -> VertexOutput {
    let canvas_width = ubo.canvasSize.x;
    let canvas_height = ubo.canvasSize.y;
    let camera_zoom = ubo.particleRadius_cameraZoom.y;
    let camera_offset = ubo.cameraOffset_simSize.xy;

    // Transform world position to Normalized Device Coordinates (NDC)
    let world_pos_relative_to_camera = worldPos - camera_offset;
    let scaled_pos = world_pos_relative_to_camera * camera_zoom;

    // Convert to NDC (-1 to 1 range)
    // X: scaled_x / (canvas_width / 2) = scaled_x * 2.0 / canvas_width
    // Y: scaled_y / (-canvas_height / 2) = scaled_y * -2.0 / canvas_height (Flip Y)
    let ndc_pos = vec2<f32>(
        scaled_pos.x * (2.0 / canvas_width),
        scaled_pos.y * (-2.0 / canvas_height) // Flip Y
    );

    var output: VertexOutput;
    output.position = vec4<f32>(ndc_pos, 0.0, 1.0); // z=0, w=1
    return output;
}
