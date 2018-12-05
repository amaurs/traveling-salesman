import React, { Component } from 'react';
import * as THREE from 'three-full';
import AnaglyphSVGRenderer from './AnaglyphSVGRenderer.js';

class Cube extends Component{
  componentDidMount() {
    const width = this.mount.clientWidth
    const height = this.mount.clientHeight
    const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
    const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const focalLength = 1000;


    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000 )
    this.camera.position.z = 4
    this.renderer = new AnaglyphSVGRenderer(width, height);
    
    this.renderer.setClearColor(0xffffff, 1.0);
 

    this.mount.appendChild(this.renderer.domElement)
    this.cube = new THREE.LineSegments(geometry, material)
    this.scene.add(this.cube)
    this.start()
  }

  componentWillUnmount() {
    this.stop()
    this.mount.removeChild(this.renderer.domElement)
  }

  start = () => {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate)
    }
  }

  stop = () => {
    cancelAnimationFrame(this.frameId)
  }

  animate = () => {
    this.cube.rotation.x += 0.01
    this.cube.rotation.y += 0.01
    this.renderScene()
    this.frameId = window.requestAnimationFrame(this.animate)
  }

  renderScene = () => {
    this.renderer.render(this.scene, this.camera)
  }

  render() {
    return(
      <div
        style={{ width: '800px', height: '800px' }}
        ref={(mount) => { this.mount = mount }}
      />
    )
  }
}
export default Cube