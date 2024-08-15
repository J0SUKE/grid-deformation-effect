import { Position, Size } from '../types/types'
import * as THREE from 'three'

import vertexShader from '../shaders/vertex.glsl'
import fragmentShader from '../shaders/fragment.glsl'
import GPGPU from '../utils/gpgpu'
import GUI from 'lil-gui'

interface Props {
  element: HTMLImageElement
  scene: THREE.Scene
  sizes: Size
  renderer: THREE.WebGLRenderer
  debug: GUI
}

export default class Media {
  element: HTMLImageElement
  scene: THREE.Scene
  sizes: Size
  material: THREE.ShaderMaterial
  geometry: THREE.PlaneGeometry
  renderer: THREE.WebGLRenderer
  mesh: THREE.Mesh
  nodeDimensions: Size
  meshDimensions: Size
  meshPostion: Position
  elementBounds: DOMRect
  currentScroll: number
  lastScroll: number
  scrollSpeed: number
  gpgpu: GPGPU
  time: number
  debug: GUI

  constructor({ element, scene, sizes, renderer, debug }: Props) {
    this.element = element
    this.scene = scene
    this.sizes = sizes
    this.renderer = renderer
    this.debug = debug

    this.currentScroll = 0
    this.lastScroll = 0
    this.scrollSpeed = 0
    this.time = 0

    this.createGeometry()
    this.createMaterial()
    this.createMesh()
    this.setNodeBounds()
    this.setMeshDimensions()
    this.setMeshPosition()

    this.setTexture()
    this.createGPGPU()
    this.setupDebug()

    this.scene.add(this.mesh)
  }

  createGeometry() {
    this.geometry = new THREE.PlaneGeometry(1, 1)
  }

  createMaterial() {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: new THREE.Uniform(new THREE.Vector4()),
        uGrid: new THREE.Uniform(new THREE.Vector4()),
        uContainerResolution: new THREE.Uniform(new THREE.Vector2()),
        uImageResolution: new THREE.Uniform(new THREE.Vector2(0, 0)),
        uDisplacement: new THREE.Uniform(0),
        uRGBshift: new THREE.Uniform(new THREE.Vector2(0.02, 0.0)),
      },
    })
  }

  setupDebug() {
    const opt = {
      dis: this.material.uniforms.uDisplacement.value > 0,
    }

    this.debug
      .add(opt, 'dis')
      .onChange((dis: boolean) => {
        if (dis) this.material.uniforms.uDisplacement.value = 1
        else this.material.uniforms.uDisplacement.value = 0
      })
      .name('grid map')

    //this.debug.add(this.material.uniforms.uRGBshift.value, 'x').min(-0.1).max(0.1).step(0.001).name('rgb X')
    //this.debug.add(this.material.uniforms.uRGBshift.value, 'y').min(-0.1).max(0.1).step(0.001).name('rgb Y')
  }

  createMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material)
  }

  createGPGPU() {
    this.gpgpu = new GPGPU({
      renderer: this.renderer,
      scene: this.scene,
      sizes: this.sizes,
      debug: this.debug,
    })
  }

  setNodeBounds() {
    this.elementBounds = this.element.getBoundingClientRect()

    this.nodeDimensions = {
      width: this.elementBounds.width,
      height: this.elementBounds.height,
    }
  }

  setMeshDimensions() {
    this.meshDimensions = {
      width: (this.nodeDimensions.width * this.sizes.width) / window.innerWidth,
      height: (this.nodeDimensions.height * this.sizes.height) / window.innerHeight,
    }

    this.mesh.scale.x = this.meshDimensions.width
    this.mesh.scale.y = this.meshDimensions.height
  }

  setMeshPosition() {
    this.meshPostion = {
      x: (this.elementBounds.left * this.sizes.width) / window.innerWidth,
      y: (-this.elementBounds.top * this.sizes.height) / window.innerHeight,
    }

    this.meshPostion.x -= this.sizes.width / 2
    this.meshPostion.x += this.meshDimensions.width / 2

    this.meshPostion.y -= this.meshDimensions.height / 2
    this.meshPostion.y += this.sizes.height / 2

    this.mesh.position.x = this.meshPostion.x
    this.mesh.position.y = this.meshPostion.y
  }

  setTexture() {
    this.material.uniforms.uTexture.value = new THREE.TextureLoader().load(this.element.src, ({ image }) => {
      const { naturalWidth, naturalHeight } = image
      const container = document.querySelector('.image-container') as HTMLElement
      const { width, height } = container.getBoundingClientRect()

      console.log(naturalWidth, naturalHeight)

      this.material.uniforms.uImageResolution.value = new THREE.Vector2(naturalWidth, naturalHeight)
      this.material.uniforms.uContainerResolution.value = new THREE.Vector2(width, height)
    })
  }

  updateScroll(scrollY: number) {
    this.currentScroll = (-scrollY * this.sizes.height) / window.innerHeight

    const deltaScroll = this.currentScroll - this.lastScroll
    this.lastScroll = this.currentScroll

    this.updateY(deltaScroll)
  }

  updateY(deltaScroll: number) {
    this.meshPostion.y -= deltaScroll
    this.mesh.position.y = this.meshPostion.y
  }

  onResize(sizes: Size) {
    this.sizes = sizes

    this.setNodeBounds()
    this.setMeshDimensions()
    this.setMeshPosition()
  }

  onMouseMove(uv: THREE.Vector2) {
    this.gpgpu.updateMouse(uv)
  }

  render(time: number) {
    const deltaTime = this.time - time
    this.time = time

    this.gpgpu.render(time, deltaTime)

    this.material.uniforms.uGrid.value = this.gpgpu.getTexture()
  }
}
