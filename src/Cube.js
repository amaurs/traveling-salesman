import React, { Component } from 'react';
import * as THREE from 'three-full';
import AnaglyphSVGRenderer from './AnaglyphSVGRenderer.js';
import './Cube.css'

class Cube extends Component{


  constructor(props) {
    super(props);
    this.state = {
        externalData: null,
    };
  }


  componentDidMount() {


    (async () => {
      
      const rawResponse = await fetch('http://192.168.42.14:5000/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({number: 3000})
      });


        const vertices = await rawResponse.json();
      
        const width = this.mount.clientWidth
        const height = this.mount.clientHeight
        //onst geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
        const material = new THREE.LineBasicMaterial({ color: 0x000000, 
                                                       linewidth: 2,
                                                       opacity: 1 });
        //const focalLength = 1000;
    
    
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000 )
        this.camera.position.z = 5
        this.renderer = new AnaglyphSVGRenderer(width, height);
        this.renderer.setClearColor(0xffffff, 0.0);
        this.mount.appendChild(this.renderer.domElement)
        //this.cube = new THREE.LineSegments(geometry, material);
        let geometry = new THREE.BufferGeometry();

        //debugger;
        geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

        this.line = new THREE.Line( geometry, material );
              
        this.scene.add( this.line );
        //this.scene.add(this.cube)
        this.start()

        this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
    })();

    /**
    let seed = util.createRandomUnitVector();

    console.log(seed);
    let phi = Math.random() * Math.PI;
    let theta = Math.random() * Math.PI * 2;
    let factor = 10;

   
    seed = new THREE.Vector3().setFromSphericalCoords(1.0, phi, theta);

    [...Array(n)].forEach(function(_, i) {


      
      vertices.push(seed.x, seed.y, seed.z);

      let newPhi = Math.random() * factor;
      let newTheta = Math.random() * factor * 2;

      let newSeed = new THREE.Vector3().setFromSphericalCoords(1.0, newPhi, newTheta);

      seed = newSeed;

    });

    **/



    
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
    //this.line.rotation.x += 0.01
    //this.line.rotation.y += 0.01
    this.renderScene();
    this.frameId = window.requestAnimationFrame(this.animate)
  }

  renderScene = () => {
    this.renderer.render(this.scene, this.camera)
  }

  render() {
    return(
      <div
        className="Cube"
        ref={(mount) => { this.mount = mount }}
      />
    )
  }
}
export default Cube