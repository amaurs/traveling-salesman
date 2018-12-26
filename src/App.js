import React, { Component } from 'react';
import './App.css';
import Cube from './Cube.js'

function download(filename, text) {
    var pom = document.createElement('a');

    pom.setAttribute('href', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}

class App extends Component {

  constructor(props) {
    super(props);
    this.cube = React.createRef();
    this.handleSave = this.handleSave.bind(this);
  }

  handleSave(event) {
    let serializer = new XMLSerializer();
    let source = serializer.serializeToString(this.cube.current.mount.childNodes[0])
    console.log(this.cube.current.mount.innerHTML);
    download("cube.svg", source)

  }

  render() {
    return (
        <div className="App-header nes-container">
            <button type="button" className="App-button nes-btn is-error" onClick={this.handleSave}>
                Export
            </button>
            <Cube ref={this.cube}/>
        </div>      
    );
  }
}

export default App;
