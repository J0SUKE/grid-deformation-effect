import * as THREE from 'three'
import fragmentShader from '../shaders/gpgpu/gpgpu.glsl'
import { GPUComputationRenderer, Variable } from 'three/addons/misc/GPUComputationRenderer.js'
import GUI from 'lil-gui'

interface Props {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
}

interface Params {
  relaxation: number
  size: number
}

export default class GPGPU {
  time: number
  size: number
  gpgpuRenderer: GPUComputationRenderer
  renderer: THREE.WebGLRenderer
  dataTexture: THREE.DataTexture
  variable: Variable
  targetVariable: Variable
  debugPlane: THREE.Mesh
  scene: THREE.Scene
  params: Params
  debug: GUI

  constructor({ renderer, scene }: Props) {
    this.scene = scene
    this.renderer = renderer

    this.params = {
      relaxation: 0.95,
      size: 200,
    }

    this.size = Math.ceil(Math.sqrt(this.params.size))
    this.time = 0

    this.createGPGPURenderer()
    this.createDataTexture()
    this.createVariable()
    this.setRendererDependencies()
    this.initiateRenderer()
    //this.createDebugPlane()
    this.createDebug()
  }

  createGPGPURenderer() {
    this.gpgpuRenderer = new GPUComputationRenderer(this.size, this.size, this.renderer)
  }

  createDataTexture() {
    this.dataTexture = this.gpgpuRenderer.createTexture()
  }

  createVariable() {
    this.variable = this.gpgpuRenderer.addVariable('uGrid', fragmentShader, this.dataTexture)
    this.variable.material.uniforms.uRelaxation = new THREE.Uniform(this.params.relaxation)
    this.variable.material.uniforms.uGridSize = new THREE.Uniform(this.size)
    this.variable.material.uniforms.uMouse = new THREE.Uniform(new THREE.Vector2(0, 0))
    this.variable.material.uniforms.uDeltaMouse = new THREE.Uniform(new THREE.Vector2(0, 0))
    this.variable.material.uniforms.uMouseMove = new THREE.Uniform(0)
  }

  setRendererDependencies() {
    this.gpgpuRenderer.setVariableDependencies(this.variable, [this.variable])
  }

  initiateRenderer() {
    this.gpgpuRenderer.init()
  }

  //   createDebugPlane() {
  //     this.debugPlane = new THREE.Mesh(
  //       new THREE.PlaneGeometry(1, 1),
  //       new THREE.MeshBasicMaterial({
  //         map: this.gpgpuRenderer.getCurrentRenderTarget(this.variable).texture,
  //       })
  //     )

  //     this.debugPlane.scale.set(4, 4, 4)
  //     this.debugPlane.position.set(-4, 4, 0)

  //     this.scene.add(this.debugPlane)
  //   }

  updateMouse(uv: THREE.Vector2) {
    this.variable.material.uniforms.uMouseMove.value = 1

    const current = this.variable.material.uniforms.uMouse.value as THREE.Vector2

    current.subVectors(uv, current)
    current.multiplyScalar(50)

    this.variable.material.uniforms.uDeltaMouse.value = current
    this.variable.material.uniforms.uMouse.value = uv
  }

  getTexture() {
    return this.gpgpuRenderer.getCurrentRenderTarget(this.variable).textures[0]
  }

  createDebug() {
    this.debug = new GUI()

    this.debug
      .add(this.params, 'relaxation')
      .min(0.5)
      .max(0.99)
      .step(0.001)
      .onChange((_: number) => {
        this.variable.material.uniforms.uRelaxation.value = _
      })
    this.debug
      .add(this.params, 'size')
      .min(10)
      .max(1000)
      .step(2)
      .onChange((value: number) => {
        this.variable.material.uniforms.uGridSize.value = Math.ceil(Math.sqrt(value))
      })
  }

  render(time: number, deltaTime: number) {
    this.time = time

    this.variable.material.uniforms.uMouseMove.value *= this.variable.material.uniforms.uRelaxation.value
    this.variable.material.uniforms.uDeltaMouse.value.multiplyScalar(this.variable.material.uniforms.uRelaxation.value)

    this.gpgpuRenderer.compute()
  }
}
