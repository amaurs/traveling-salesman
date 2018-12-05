import * as THREE from 'three-full';

class AnaglyphSVGRenderer {
  constructor(width, height) {
    this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.domElement = this._svg;


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

    this._normalViewMatrix = new THREE.Matrix3();

    this.setSize(width, height);

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
    this._pathCount = 0;
    while(this._svg.childNodes.length > 0) {
      this._svg.removeChild(this._svg.childNodes[0]);
    }
  }

  getSvgColor(color, opacity) {
    const arg = Math.floor( color.r * 255 ) + ',' + Math.floor( color.g * 255 ) + ',' + Math.floor( color.b * 255 );
    if ( opacity === undefined || opacity === 1 ) {
      return 'rgb(' + arg + ')';
    }
    return 'rgb(' + arg + '); fill-opacity: ' + opacity;
  }

  convert(c) {
    return this._precision !== null ? c.toFixed(this._precision) : c;
  }

  clear() {
    this.removeChildNodes();
    this._svg.style.backgroundColor = this.getSvgColor(this._clearColor, this._clearAlpha);
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

    let _renderData = this._projector.projectScene( scene, camera, this.sortObjects, this.sortElements );
    let _elements = _renderData.elements;

    this._normalViewMatrix.getNormalMatrix( camera.matrixWorldInverse );


    this._currentPath = '';
    this._currentStyle = '';

    for ( var e = 0, el = _elements.length; e < el; e ++ ) {
      var element = _elements[ e ];
      var material = element.material;

      if ( material === undefined || material.opacity === 0 ) continue;

      this._elemBox.makeEmpty();

      if( element instanceof THREE.RenderableLine ) {
        this._v1 = element.v1; this._v2 = element.v2;
        this._v1.positionScreen.x *= this._svgWidthHalf; 
        this._v1.positionScreen.y *= - this._svgHeightHalf;
        this._v2.positionScreen.x *= this._svgWidthHalf; 
        this._v2.positionScreen.y *= - this._svgHeightHalf;
        this._elemBox.setFromPoints([ this._v1.positionScreen, this._v2.positionScreen ]);
        if(this._clipBox.intersectsBox(this._elemBox) === true) {
          this.renderLine(this._v1, this._v2, element, material);
        }
      } 

    }


    this.flushPath(); // just to flush last svg:path


    scene.traverseVisible(function(object) {
      if ( object instanceof THREE.SVGObject ) {

        this._vector3.setFromMatrixPosition( object.matrixWorld );
        this._vector3.applyMatrix4(this._viewProjectionMatrix );

        let x = this._vector3.x *this. _svgWidthHalf;
        let y = - this._vector3.y * this._svgHeightHalf;

        let node = object.node;
        node.setAttribute( 'transform', 'translate(' + x + ',' + y + ')' );

        this._svg.appendChild( node );

      }

    } );
  }

  renderLine(v1, v2, element, material) {
    let path = 'M' + this.convert( v1.positionScreen.x ) + ',' + this.convert( v1.positionScreen.y ) + 'L' + this.convert( v2.positionScreen.x ) + ',' + this.convert( v2.positionScreen.y );
    if ( material.isLineBasicMaterial ) {
      let style = 'fill:none;stroke:' + this.getSvgColor( material.color, material.opacity ) + ';stroke-width:' + material.linewidth + ';stroke-linecap:' + material.linecap;
      if ( material.isLineDashedMaterial ) {
        style = style + ';stroke-dasharray:' + material.dashSize + "," + material.gapSize;
      }
      this.addPath( style, path );
    }
  }

  addPath(style, path) {
    if( this._currentStyle === style ) {
      this._currentPath += path;
    } else {
      this.flushPath();
      this._currentStyle = style;
      this._currentPath = path;
    }
  }

  flushPath() {
    if (this._currentPath ) {
      this._svgNode = this.getPathNode(this._pathCount++);
      this._svgNode.setAttribute('d', this._currentPath);
      this._svgNode.setAttribute('style', this._currentStyle);
      this._svg.appendChild(this._svgNode );
    }
    this._currentPath = '';
    this._currentStyle = '';
  }

  getPathNode(id) {
    if(this._svgPathPool[id] == null ) {
      this._svgPathPool[id] = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );
      if(this._quality == 0) {
        this._svgPathPool[id].setAttribute( 'shape-rendering', 'crispEdges' ); //optimizeSpeed
      }
      return this._svgPathPool[id];
    }
    return this._svgPathPool[id];
  }

}

export default AnaglyphSVGRenderer;