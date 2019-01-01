import * as THREE from 'three-full';

class AnaglyphSVGRenderer {
  constructor(width, height) {
    this.domElement = document.createElement("div"); 

    this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this._svg_right = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    this.domElement.appendChild(this._svg);
    this.domElement.appendChild(this._svg_right);


    this._stereo = new THREE.StereoCamera();
    this._camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );


    this._clipBox = new THREE.Box2();
    this._elemBox = new THREE.Box2();

    this._projector = new THREE.Projector();

    this._quality = 1;
    this._precision = null;
    this._svgPathPool = [];
    this._clearColor = new THREE.Color();
    this._clearAlpha = 1;

    this._vector3 = new THREE.Vector3();

    this._viewMatrix = new THREE.Matrix4();
    this._viewProjectionMatrix = new THREE.Matrix4();

    

    this.setSize(width, height);

    this.autoClear = true;

    this.info = {

    render: {

      vertices: 0,
      faces: 0

    }

  };
  }

  setQuality(quality) {
    switch(quality) {
      case "high": 
        this._quality = 1; 
        break;
      case "low": 
        this._quality = 0; 
        break;
      default:
        break;
    }
  }

  setClearColor(color, alpha) {
    this._clearColor.set( color );
    this._clearAlpha = alpha !== undefined ? alpha : 1;
  }

  setPixelRatio() {

  }

  setSize(width, height) {

    this._svgWidth = width; 
    this._svgHeight = height;
    this._svgWidthHalf = this._svgWidth / 2;
    this._svgHeightHalf = this._svgHeight / 2;

    this._pathCount = 0;

    this._svg.setAttribute('viewBox', (- this._svgWidthHalf ) + ' ' + (- this._svgHeightHalf ) + ' ' + this._svgWidth + ' ' + this._svgHeight);
    this._svg.setAttribute('width', this._svgWidth );
    this._svg.setAttribute('height', this._svgHeight );

    this._clipBox.min.set( - this._svgWidthHalf, - this._svgHeightHalf );
    this._clipBox.max.set( this._svgWidthHalf, this._svgHeightHalf );

  }

  setPrecision(precision) {
    this._precision = precision;
  };

  removeChildNodes() {
    this.removeChildNodesGeneral(this._svg);
  }

  removeChildNodesGeneral(container) {
    this._pathCount = 0;
    while(container.childNodes.length > 0) {
      container.removeChild(container.childNodes[0]);
    }
  }

  getSvgColor(color, opacity) {
    const arg = Math.floor( color.r * 255 ) + ',' + Math.floor( color.g * 255 ) + ',' + Math.floor( color.b * 255 );
    if ( opacity === undefined || opacity === 1 ) {
      return 'rgb(' + arg + ')';
    }
    return 'rgb(' + arg + '); fill-opacity: ' + opacity + '; stroke-opacity: ' + opacity ;
  }

  convert(c) {
    return this._precision !== null ? c.toFixed(this._precision) : c;
  }

  clear() {
    this.removeChildNodes();
    this._svg.style.backgroundColor = this.getSvgColor(this._clearColor, this._clearAlpha);
  }

  renderCamera(_elements, camera, color, container) {

    let _normalViewMatrix = new THREE.Matrix3();

    _normalViewMatrix.getNormalMatrix( camera.matrixWorldInverse ) ;

    this._currentPath = '';
    this._currentStyle = '';

    for ( let e = 0, el = _elements.length; e < el; e ++ ) {
      let element = _elements[ e ];
      let material = element.material;

      material.color = color;
      material.opacity = 0.8;

      if ( material === undefined || material.opacity === 0 ) continue;

      this._elemBox.makeEmpty();

      if( element instanceof THREE.RenderableLine ) {
        let _v1 = element.v1; 
        let _v2 = element.v2;
        _v1.positionScreen.x *= this._svgWidthHalf; 
        _v1.positionScreen.y *= - this._svgHeightHalf;
        _v2.positionScreen.x *= this._svgWidthHalf; 
        _v2.positionScreen.y *= - this._svgHeightHalf;
        this._elemBox.setFromPoints([ _v1.positionScreen, _v2.positionScreen ]);
        if(this._clipBox.intersectsBox(this._elemBox) === true) {
          this.renderLine(_v1, _v2, element, material, container);
        }
      } 
    }

  }


  render(scene, camera){
    
    if ( camera instanceof THREE.Camera === false ) {

      console.error( 'SVGRenderer.render: camera is not an instance of Camera.' );
      return;
    }

    let background = scene.background;

  

    if ( background && background.isColor ) {
      
      this.removeChildNodes();
      this._svg.style.backgroundColor = this.getSvgColor( background );

    } else if ( this.autoClear === true ) {
      
      this.clear();

    }

    this.info.render.vertices = 0;
    this.info.render.faces = 0;

    this._viewMatrix.copy( camera.matrixWorldInverse );
    this._viewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, this._viewMatrix );

    scene.updateMatrixWorld();
    if ( camera.parent === null ) 
      camera.updateMatrixWorld();
    
    this._stereo.update(camera);

    let _renderDataL = this._projector.projectScene( scene, this._stereo.cameraL, this.sortObjects, this.sortElements );
    let _elements = _renderDataL.elements;
    this.renderCamera(_elements, this._stereo.cameraL, new THREE.Color(1,0,0), this._svg);
    this.flushPath(this._svg);
    
    let _renderDataR = this._projector.projectScene( scene, this._stereo.cameraR, this.sortObjects, this.sortElements );
    _elements = _renderDataR.elements;
    this.renderCamera(_elements, this._stereo.cameraR, new THREE.Color(0,0,1), this._svg);
    this.flushPath(this._svg);




    scene.traverseVisible(function(object) {
      if ( object instanceof THREE.SVGObject ) {

        this._vector3.setFromMatrixPosition( object.matrixWorld );
        this._vector3.applyMatrix4(this._viewProjectionMatrix );

        let x = this._vector3.x * this._svgWidthHalf;
        let y = - this._vector3.y * this._svgHeightHalf;

        let node = object.node;
        node.setAttribute( 'transform', 'translate(' + x + ',' + y + ')' );

        this._svg.appendChild( node );

      }

    } );
  }

  renderLine(v1, v2, element, material, container) {
    let path = 'M' + this.convert( v1.positionScreen.x ) + ',' + this.convert( v1.positionScreen.y ) + 'L' + this.convert( v2.positionScreen.x ) + ',' + this.convert( v2.positionScreen.y );
    if ( material.isLineBasicMaterial ) {
      let style = 'fill:none;stroke:' + this.getSvgColor( material.color, material.opacity ) + ';stroke-width:' + material.linewidth + ';stroke-linecap:' + material.linecap;
      if ( material.isLineDashedMaterial ) {
        style = style + ';stroke-dasharray:' + material.dashSize + "," + material.gapSize;
      }
      this.addPath( style, path, container );
    }
  }

  addPath(style, path, container) {
    if( this._currentStyle === style ) {
      this._currentPath += path;
    } else {
      this.flushPath(container);
      this._currentStyle = style;
      this._currentPath = path;
    }
  }

  flushPath(container) {
    if (this._currentPath ) {
      this._svgNode = this.getPathNode(this._pathCount++);
      this._svgNode.setAttribute('d', this._currentPath);
      this._svgNode.setAttribute('style', this._currentStyle);
      container.appendChild(this._svgNode );
    }
    this._currentPath = '';
    this._currentStyle = '';
  }

  getPathNode(id) {
    if(this._svgPathPool[id] == null ) {
      this._svgPathPool[id] = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );
      if(this._quality === 0) {
        this._svgPathPool[id].setAttribute( 'shape-rendering', 'crispEdges' ); //optimizeSpeed
      }
      return this._svgPathPool[id];
    }
    return this._svgPathPool[id];
  }

}

export default AnaglyphSVGRenderer;