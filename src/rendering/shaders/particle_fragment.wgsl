struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) quad_pos: vec2<f32>,
};

@fragment
fn main(frag_in: VertexOutput) -> @location(0) vec4<f32> {
    let dist_sq = dot(frag_in.quad_pos, frag_in.quad_pos);
    if (dist_sq > 1.0) {
        discard;
    }

    return frag_in.color;
}
