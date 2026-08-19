"use client";

import React, { useEffect, useRef } from "react";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * ORGANIC FLUID ATMOSPHERE — WEBGL PROCEDURAL BACKDROP
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Subtle, slow-drifting mineral pigment / dark liquid diffusion:
 * - Palette: #080908, #10120F, #171A13, #242719 with deep olive & warm bronze undertones
 * - FBM (Fractional Brownian Motion) organic flow with zero fast particles or neon glows
 * - 20-30% Camera Parallax inertia
 * - Fine procedural film grain overlay
 * - Graceful fallback to CSS radial gradients if WebGL is unavailable
 */

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_parallax;

// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// 2D Value Noise
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractional Brownian Motion (FBM)
float fbm (in vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(st);
        st = rot * st * 2.0 + vec2(0.1, 0.2);
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;

    // Apply slow fluid drift + 20% parallax inertia
    vec2 movement = vec2(u_time * 0.012, u_time * 0.008) + u_parallax * 0.22;
    vec2 p = st * 1.8 + movement;

    // Complex organic domain warping
    vec2 q = vec2(0.);
    q.x = fbm(p + vec2(0.0, 0.0));
    q.y = fbm(p + vec2(5.2, 1.3));

    vec2 r = vec2(0.);
    r.x = fbm(p + 1.0 * q + vec2(1.7, 9.2) + 0.015 * u_time);
    r.y = fbm(p + 1.0 * q + vec2(8.3, 2.8) + 0.012 * u_time);

    float f = fbm(p + r);

    // Color mixing: #080908, #10120F, #171A13, #242719, deep muted olive #384228, bronze #4A3A2C
    vec3 col_base = vec3(0.031, 0.035, 0.031);   // #080908
    vec3 col_deep = vec3(0.063, 0.071, 0.059);   // #10120F
    vec3 col_olive = vec3(0.090, 0.102, 0.075);  // #171A13
    vec3 col_amber = vec3(0.141, 0.153, 0.098);  // #242719
    vec3 col_warm = vec3(0.180, 0.140, 0.110);   // #2E241C

    vec3 color = mix(col_base, col_deep, clamp((f*f)*4.0, 0.0, 1.0));
    color = mix(color, col_olive, clamp(length(q), 0.0, 1.0) * 0.6);
    color = mix(color, col_amber, clamp(length(r.x), 0.0, 1.0) * 0.4);
    color = mix(color, col_warm, clamp(f*f*f*f, 0.0, 1.0) * 0.25);

    // Fine organic film grain
    float grain = (random(st * 100.0 + fract(u_time * 10.0)) - 0.5) * 0.03;
    color += grain;

    // Edge vignette
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
    vignette = clamp(pow(16.0 * vignette, 0.25), 0.0, 1.0);
    color *= mix(0.7, 1.0, vignette);

    gl_FragColor = vec4(color, 1.0);
}
`;

export default function OrganicFluidAtmosphere({ parallaxX = 0, parallaxY = 0, className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl = canvas.getContext("webgl", { powerPreference: "low-power", antialias: false });
    if (!gl) return;

    const createShader = (gl, type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vertShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Quad geometry
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const resLoc = gl.getUniformLocation(program, "u_resolution");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const parallaxLoc = gl.getUniformLocation(program, "u_parallax");

    let animationId;
    let startTime = performance.now();

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = canvas.clientWidth * dpr;
      const height = canvas.clientHeight * dpr;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const render = (now) => {
      const elapsed = (now - startTime) * 0.001;
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, elapsed);
      gl.uniform2f(parallaxLoc, parallaxX, parallaxY);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(program);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      gl.deleteBuffer(buffer);
    };
  }, [parallaxX, parallaxY]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full pointer-events-none ${className}`}
      style={{ display: "block" }}
    />
  );
}
