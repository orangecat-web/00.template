const vertexSource = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

const fragmentSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v_uv;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_yaw;
uniform float u_pitch;
uniform float u_fov;
const float PI = 3.141592653589793;

void main() {
  vec2 screen = v_uv * 2.0 - 1.0;
  float focal = 1.0 / tan(radians(u_fov) * 0.5);
  vec3 ray = normalize(vec3(screen.x * u_resolution.x / u_resolution.y, screen.y, focal));

  float cp = cos(u_pitch), sp = sin(u_pitch);
  vec3 tilted = vec3(ray.x, cp * ray.y + sp * ray.z, -sp * ray.y + cp * ray.z);
  float cy = cos(u_yaw), sy = sin(u_yaw);
  vec3 direction = vec3(cy * tilted.x + sy * tilted.z, tilted.y,
                        -sy * tilted.x + cy * tilted.z);

  float longitude = atan(direction.x, direction.z);
  float latitude = asin(clamp(direction.y, -1.0, 1.0));
  vec2 panoramaUV = vec2(fract(longitude / (2.0 * PI) + 0.5),
                         clamp(0.5 - latitude / PI, 0.001, 0.999));
  gl_FragColor = texture2D(u_image, panoramaUV);
}`

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(error || '環景著色器無法編譯')
  }
  return shader
}

function isPowerOfTwo(number) {
  return (number & (number - 1)) === 0
}

// WebGL 細節留在這個實例；Vue 元件只管理場景與操作狀態。
export class PanoramaRenderer {
  constructor(canvas) {
    const gl = canvas.getContext('webgl', { alpha: false, antialias: true })
    if (!gl) throw new Error('此瀏覽器無法啟用 WebGL 環景檢視。')
    this.gl = gl
    this.canvas = canvas
    this.vertex = compile(gl, gl.VERTEX_SHADER, vertexSource)
    this.fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource)
    this.program = gl.createProgram()
    gl.attachShader(this.program, this.vertex)
    gl.attachShader(this.program, this.fragment)
    gl.linkProgram(this.program)
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(this.program) || '環景程式無法連結')
    }

    this.position = gl.getAttribLocation(this.program, 'a_position')
    this.uniforms = Object.fromEntries(['u_image', 'u_resolution', 'u_yaw', 'u_pitch', 'u_fov']
      .map((name) => [name, gl.getUniformLocation(this.program, name)]))
    this.buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    this.texture = gl.createTexture()
    this.hasImage = false
  }

  setImage(image) {
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    const canRepeat = isPowerOfTwo(image.naturalWidth) && isPowerOfTwo(image.naturalHeight)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, canRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    this.hasImage = true
  }

  draw({ yaw, pitch, fov }) {
    if (!this.hasImage) return
    const gl = this.gl
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.round(this.canvas.clientWidth * ratio))
    const height = Math.max(1, Math.round(this.canvas.clientHeight * ratio))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }
    gl.viewport(0, 0, width, height)
    gl.useProgram(this.program)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.enableVertexAttribArray(this.position)
    gl.vertexAttribPointer(this.position, 2, gl.FLOAT, false, 0, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.uniform1i(this.uniforms.u_image, 0)
    gl.uniform2f(this.uniforms.u_resolution, width, height)
    gl.uniform1f(this.uniforms.u_yaw, yaw)
    gl.uniform1f(this.uniforms.u_pitch, pitch)
    gl.uniform1f(this.uniforms.u_fov, fov)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  destroy() {
    const gl = this.gl
    gl.deleteTexture(this.texture)
    gl.deleteBuffer(this.buffer)
    gl.deleteProgram(this.program)
    gl.deleteShader(this.vertex)
    gl.deleteShader(this.fragment)
  }
}
