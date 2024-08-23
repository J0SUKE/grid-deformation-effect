import * as THREE from 'three'
import fragmentShader from '../shaders/gpgpu/gpgpu.glsl'
import { GPUComputationRenderer, Variable } from 'three/addons/misc/GPUComputationRenderer.js'
import GUI from 'lil-gui'
import { Size } from '../types/types'

interface Props {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  sizes: Size
  debug: GUI
}

interface Params {
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
      size: 700,
    }

    this.size = Math.ceil(Math.sqrt(this.params.size))
    this.time = 0

    this.createGPGPURenderer()
    this.createDataTexture()
    this.createVariable()
    this.setRendererDependencies()
    this.initiateRenderer()
  }

  createGPGPURenderer() {
    this.gpgpuRenderer = new GPUComputationRenderer(
      this.size, //the size of the grid we want to create, in the example the size is 27
      this.size,
      this.renderer //the WebGLRenderer we are using for our scene
    )
  }
  createDataTexture() {
    this.dataTexture = this.gpgpuRenderer.createTexture()
  }

  createVariable() {
    this.variable = this.gpgpuRenderer.addVariable('uGrid', fragmentShader, this.dataTexture)
    this.variable.material.uniforms.uGridSize = new THREE.Uniform(this.size)
    this.variable.material.uniforms.uMouse = new THREE.Uniform(new THREE.Vector2(0, 0))
    this.variable.material.uniforms.uDeltaMouse = new THREE.Uniform(new THREE.Vector2(0, 0))
  }

  setRendererDependencies() {
    this.gpgpuRenderer.setVariableDependencies(this.variable, [this.variable])
  }

  initiateRenderer() {
    this.gpgpuRenderer.init()
  }

  updateMouse(uv: THREE.Vector2) {
    //this.variable.material.uniforms.uMouseMove.value = 1

    const current = this.variable.material.uniforms.uMouse.value as THREE.Vector2

    current.subVectors(uv, current)
    current.multiplyScalar(80)

    this.variable.material.uniforms.uDeltaMouse.value = current
    this.variable.material.uniforms.uMouse.value = uv
  }

  getTexture() {
    return this.gpgpuRenderer.getCurrentRenderTarget(this.variable).textures[0]
  }

  render(time: number, deltaTime: number) {
    //this.variable.material.uniforms.uDeltaMouse.value.multiplyScalar(this.variable.material.uniforms.uRelaxation.value)

    this.gpgpuRenderer.compute()
  }
}
