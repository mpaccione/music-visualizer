var finalshader = {
    uniforms: {
        tDiffuse: { type: "t", value: 0, texture: null }, // The base scene buffer
        tGlow: { type: "t", value: 1, texture: null } // The glow scene buffer
    },
 
    vertexShader: [
        "varying vec2 vUv;",
 
        "void main() {",
 
            "vUv = vec2( uv.x, 1.0 - uv.y );",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
 
        "}"
    ].join("n"),
 
    fragmentShader: [
        "uniform sampler2D tDiffuse;",
        "uniform sampler2D tGlow;",
 
        "varying vec2 vUv;",
 
        "void main() {",
 
            "vec4 texel = texture2D( tDiffuse, vUv );",
            "vec4 glow = texture2D( tGlow, vUv );",
            "gl_FragColor = texel + vec4(0.5, 0.75, 1.0, 1.0) * glow * 2.0;", // Blend the two buffers together (I colorized and intensified the glow at the same time)
 
        "}"
    ].join("n")
};