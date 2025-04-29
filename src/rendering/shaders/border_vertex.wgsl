struct SceneUniforms {
    canvas_size: vec2<f32>,
    camera_zoom: f32,
    camera_offset: vec2<f32>,
    sim_size: vec2<f32>,
};
@group(0) @binding(1) var<uniform> ubo: SceneUniforms;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
};

@vertex
fn main(
    @location(0) world_pos: vec2<f32>
) -> VertexOutput {
    let world_pos_relative_to_camera = world_pos - ubo.camera_offset;
    let scaled_pos = world_pos_relative_to_camera * ubo.camera_zoom;

    let ndc_pos = vec2<f32>(
        scaled_pos.x * (2.0 / ubo.canvas_size.x),
        scaled_pos.y * (-2.0 / ubo.canvas_size.y)
    );

    var output: VertexOutput;
    output.position = vec4<f32>(ndc_pos, 0.0, 1.0);
    return output;
}
