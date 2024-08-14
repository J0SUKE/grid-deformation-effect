import './style.scss'
import Canvas from './components/canvas'

class App {
  canvas: Canvas

  constructor() {
    this.canvas = new Canvas()

    this.render()
  }

  render() {
    this.canvas.render()
    requestAnimationFrame(this.render.bind(this))
  }
}

export default new App()
