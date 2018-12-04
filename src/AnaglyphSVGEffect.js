import * as THREE from 'three-full';

class AnaglyphSVGEffect {
  constructor(renderer, width, height) {
    this.renderer = renderer;
    this._stereo = new THREE.StereoCamera();
    this._camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this._scene = new THREE.Scene();
    this.width = width;
    this.height = height;
  }

  render(scene, camera){
    scene.updateMatrixWorld();
    if ( camera.parent === null ) 
      camera.updateMatrixWorld();
    this._stereo.update(camera);
    this.renderer.render(scene, this._stereo.cameraL);
    this.renderer.render(scene, this._stereo.cameraR);
    //this.renderer.render(this._scene, this._camera );
  }
}

export default AnaglyphSVGEffect;