THREE.displacementShader = {

	vertexShader: [

        `
        uniform float amplitude;
        attribute float displacement;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {

            vNormal = normal;
            vUv = (0.5 + amplitude) * uv + vec2( amplitude );

            vec3 newPosition = position + amplitude * normal * vec3( displacement );
            gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );

        }

        `

	].join("\n"),

	fragmentShader: [

        "varying vec3 vNormal;",
        "varying vec2 vUv;",
        "uniform vec3 color;",
        "uniform float ambient;",
        "uniform vec3 fogColor;",
        "uniform float fogNear;",
        "uniform float fogFar;",
        
        "void main() {",
            
            `#ifdef USE_FOG
                #ifdef USE_LOGDEPTHBUF_EXT
                    float depth = gl_FragDepthEXT / gl_FragCoord.w;
                #else
                    float depth = gl_FragCoord.z / gl_FragCoord.w;
                #endif
                float fogFactor = smoothstep( fogNear, fogFar, depth );
                vec3 resultingColor = mix( color, fogColor, fogFactor );
            #endif`,
            "gl_FragColor =  vec4( ambient * vec3( resultingColor ), 1.0 );",
        "}"

	].join("\n")

}

THREE.glowShader = {

    vertexShader: [

        `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position =  projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }

        `

    ].join("\n"),

    fragmentShader: [

        
        "uniform sampler2D glowTexture;",
        "varying vec2 vUv;",
        "uniform vec3 fogColor;",
        "uniform float fogNear;",
        "uniform float fogFar;",
        
        "void main() {",
            `
            gl_FragColor = texture2D(glowTexture, vUv);
            `,
            `#ifdef USE_FOG
                  #ifdef USE_LOGDEPTHBUF_EXT
                      float depth = gl_FragDepthEXT / gl_FragCoord.w;
                  #else
                      float depth = gl_FragCoord.z / gl_FragCoord.w;
                  #endif
                  float fogFactor = smoothstep( fogNear, fogFar, depth );
                  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
              #endif`,
        "}"

    ].join("\n")

}
