import * as THREE from 'three'
import fragmentShader from '../shaders/gpgpu/gpgpu.glsl'
import { GPUComputationRenderer, Variable } from 'three/addons/misc/GPUComputationRenderer.js'
import GUI from 'lil-gui'
import { Size } from '../types/types'
import { min } from 'three/webgpu'

interface Props {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  sizes: Size
  debug: GUI
}

interface Params {
  relaxation: number
  size: number
  distance: number
  strengh: number
}

export default class GPGPU {
  time: number
  size: number
  sizes: Size
  gpgpuRenderer: GPUComputationRenderer
  renderer: THREE.WebGLRenderer
  dataTexture: THREE.DataTexture
  variable: Variable
  targetVariable: Variable
  debugPlane: THREE.Mesh
  scene: THREE.Scene
  params: Params
  debug: GUI

  constructor({ renderer, scene, sizes, debug }: Props) {
    this.scene = scene
    this.renderer = renderer
    this.sizes = sizes
    this.debug = debug

    this.params = {
      relaxation: 0.965,
      size: 700,
      distance: 0.6,
      strengh: 0.8,
    }

    this.size = Math.ceil(Math.sqrt(this.params.size))
    this.time = 0

    this.createGPGPURenderer()
    this.createDataTexture()
    this.createVariable()
    this.setRendererDependencies()
    this.initiateRenderer()
    //this.createDebugPlane()
    this.setupDebug()
  }

  createGPGPURenderer() {
    this.gpgpuRenderer = new GPUComputationRenderer(this.size, this.size, this.renderer)
  }

  createDataTexture() {
    this.dataTexture = this.gpgpuRenderer.createTexture()
  }

  createVariable() {
    this.variable = this.gpgpuRenderer.addVariable('uGrid', fragmentShader, this.dataTexture)
    this.variable.material.uniforms.uTime = new THREE.Uniform(0)
    this.variable.material.uniforms.uRelaxation = new THREE.Uniform(this.params.relaxation)
    this.variable.material.uniforms.uGridSize = new THREE.Uniform(this.size)
    this.variable.material.uniforms.uMouse = new THREE.Uniform(new THREE.Vector2(0, 0))
    this.variable.material.uniforms.uDeltaMouse = new THREE.Uniform(new THREE.Vector2(0, 0))
    this.variable.material.uniforms.uMouseMove = new THREE.Uniform(0)
    this.variable.material.uniforms.uDistance = new THREE.Uniform(this.params.distance * 10)
  }

  setRendererDependencies() {
    this.gpgpuRenderer.setVariableDependencies(this.variable, [this.variable])
  }

  initiateRenderer() {
    this.gpgpuRenderer.init()
  }

  createDebugPlane() {
    this.debugPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: this.gpgpuRenderer.getCurrentRenderTarget(this.variable).texture,
      })
    )

    this.debugPlane.scale.set(8, 8, 1)
    //this.debugPlane.position.set(-4, 4, 0)

    this.scene.add(this.debugPlane)
  }

  updateMouse(uv: THREE.Vector2) {
    this.variable.material.uniforms.uMouseMove.value = 1

    const current = this.variable.material.uniforms.uMouse.value as THREE.Vector2

    current.subVectors(uv, current)
    current.multiplyScalar(this.params.strengh * 100)

    this.variable.material.uniforms.uDeltaMouse.value = current
    this.variable.material.uniforms.uMouse.value = uv
  }

  getTexture() {
    return this.gpgpuRenderer.getCurrentRenderTarget(this.variable).textures[0]
  }

  setupDebug() {
    this.debug
      .add(this.params, 'relaxation')
      .min(0.5)
      .max(0.99)
      .step(0.001)
      .onChange((_: number) => {
        this.variable.material.uniforms.uRelaxation.value = _
      })

    this.debug
      .add(this.params, 'distance')
      .min(0)
      .max(1)
      .step(0.001)
      .onChange((_: number) => {
        this.variable.material.uniforms.uDistance.value = _ * 10
      })
    this.debug.add(this.params, 'strengh').min(0).max(1).step(0.001)
  }

  render(time: number, deltaTime: number) {
    this.time = time

    this.variable.material.uniforms.uTime.value = this.time
    this.variable.material.uniforms.uMouseMove.value *= 0.95
    this.variable.material.uniforms.uDeltaMouse.value.multiplyScalar(this.variable.material.uniforms.uRelaxation.value)

    this.gpgpuRenderer.compute()
  }
}
