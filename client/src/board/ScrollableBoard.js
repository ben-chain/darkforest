import React, { Component } from "react";
import {getCurrentPopulation, getPlanetLocationIfKnown, isPlanet} from "../utils/Utils";
import Camera from "./Camera";
import {CHUNK_SIZE} from "../constants";

class ScrollableBoard extends Component {
  canvasRef = React.createRef();
  ctx;
  camera;

  topBorder = {
    x: 14.5,
    y: 29.3,
    width: 30,
    height: 0.2
  };
  bottomBorder = {
    x: 14.5,
    y: -0.3,
    width: 30,
    height: 0.2
  };
  leftBorder = {
    x: -0.3,
    y: 14.5,
    width: 0.2,
    height: 30
  };
  rightBorder = {
    x: 29.3,
    y: 14.5,
    width: 0.2,
    height: 30
  };

  PlanetViewTypes = {
    UNOCCUPIED: 0,
    MINE: 1,
    ENEMY: 2
  };

  constructor(props) {
    super(props);

    this.state = {
      width: 768,
      height: 640,
      mouseDown: null, // world coords, rounded to int
      hoveringOver: null // world coords, rounded to int
    };
  }

  componentDidMount() {
    this.canvas = this.canvasRef.current;
    this.ctx = this.canvas.getContext("2d");
    // TODO: pull viewportwidth and height from page, set page size listener to update
    this.camera = new Camera(14.5, 14.5, -0.5, -0.5, 29.5, 29.5, 15, this.state.width, this.state.height);
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseout', this.onMouseOut.bind(this));
    this.canvas.addEventListener('mousewheel', this.onScroll.bind(this));
    this.canvas.addEventListener('DOMMouseScroll', this.onScroll.bind(this));

    setInterval(() => this.frame(), 1000 / 30);
  }

  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const worldCoords = this.camera.canvasToWorldCoords(canvasX, canvasY);
    this.setState({
      mouseDown: {x: Math.round(worldCoords.x), y: Math.round(worldCoords.y)}
    });
    this.camera.onMouseDown(canvasX, canvasY);
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const worldCoords = this.camera.canvasToWorldCoords(canvasX, canvasY);
    const worldX = Math.round(worldCoords.x);
    const worldY = Math.round(worldCoords.y);
    this.setState({
      hoveringOver: {x: worldX, y: worldY}
    });
    if (!!this.state.mouseDown && !getPlanetLocationIfKnown(this.state.mouseDown.x, this.state.mouseDown.y, this.props.knownBoard)) {
      // move camera if not holding down on a planet
      this.camera.onMouseMove(canvasX, canvasY);
    }
  }

  onMouseUp(e) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const worldCoords = this.camera.canvasToWorldCoords(canvasX, canvasY);
    const worldX = Math.round(worldCoords.x);
    const worldY = Math.round(worldCoords.y);
    if (!this.state.mouseDown) {
      return;
    }
    if (worldX === this.state.mouseDown.x && worldY === this.state.mouseDown.y && !!getPlanetLocationIfKnown(worldX, worldY, this.props.knownBoard)) {
      // if clicked on a planet, select it
      this.props.toggleSelect(worldX, worldY);
    } else {
      const endPlanetLocation = getPlanetLocationIfKnown(worldX, worldY, this.props.knownBoard);
      if (!!endPlanetLocation) {
        // if dragged between two planets, initiate a move if legal
        const startX = this.state.mouseDown.x;
        const startY = this.state.mouseDown.y;
        const startPlanetLocation = getPlanetLocationIfKnown(startX, startY, this.props.knownBoard);
        if (!!startPlanetLocation) {
          if (this.props.planets[startPlanetLocation.hash].owner.toLowerCase() === this.props.myAddress.toLowerCase()) {
            this.props.move({
              x: startX,
              y: startY,
              hash: startPlanetLocation.hash
            }, {
              x: worldX,
              y: worldY,
              hash: endPlanetLocation.hash
            });
          }
        }
      }
    }
    this.setState({
      mouseDown: null
    });
    if (!!this.state.mouseDown && !getPlanetLocationIfKnown(this.state.mouseDown.x, this.state.mouseDown.y, this.props.knownBoard)) {
      // move if not holding down on a planet
      this.camera.onMouseUp(canvasX, canvasY);
    }
  }

  onMouseOut(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.setState({hoveringOver: null, mouseDown: null});
    if (!!this.state.mouseDown && !getPlanetLocationIfKnown(this.state.mouseDown.x, this.state.mouseDown.y, this.props.knownBoard)) {
      // move if not holding down on a planet
      this.camera.onMouseUp(e.clientX - rect.left, e.clientY - rect.top);
    }
  }

  onScroll(e) {
    e.preventDefault();
    this.camera.onWheel(e.deltaY);
  }

  updateGame() {
    // no-op
  }

  drawGame() {
    this.drawBoard();
    this.drawGameObject(this.topBorder);
    this.drawGameObject(this.bottomBorder);
    this.drawGameObject(this.leftBorder);
    this.drawGameObject(this.rightBorder);
  }

  drawGameObject(gameObject) {
    const centerCanvasCoords = this.camera.worldToCanvasCoords(gameObject.x, gameObject.y);
    this.ctx.fillRect(centerCanvasCoords.x - gameObject.width / this.camera.scale / 2,
      centerCanvasCoords.y - gameObject.height / this.camera.scale / 2,
      gameObject.width / this.camera.scale,
      gameObject.height / this.camera.scale);
  }

  drawPlanet(planetDesc) {
    if (planetDesc.type === this.PlanetViewTypes.UNOCCUPIED) {
      this.ctx.fillStyle = 'green';
    }
    if (planetDesc.type === this.PlanetViewTypes.MINE) {
      this.ctx.fillStyle = 'blue';
    }
    if (planetDesc.type === this.PlanetViewTypes.ENEMY) {
      this.ctx.fillStyle = 'red';
    }
    const centerCanvasCoords = this.camera.worldToCanvasCoords(planetDesc.x, planetDesc.y);
    const width = 0.6;
    const height = 0.6;
    this.ctx.fillRect(centerCanvasCoords.x - width / this.camera.scale / 2,
      centerCanvasCoords.y - height / this.camera.scale / 2,
      width / this.camera.scale,
      height / this.camera.scale);
    // draw text
    this.ctx.font = '15px sans-serif';
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = 'white';
    this.ctx.fillText(planetDesc.population.toString(), centerCanvasCoords.x, centerCanvasCoords.y + 0.5 * height / this.camera.scale);
  }

  drawHoveringRect(x, y) {
    this.ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 4;
    const centerCanvasCoords = this.camera.worldToCanvasCoords(x, y);
    this.ctx.strokeRect(centerCanvasCoords.x - 1 / this.camera.scale / 2,
      centerCanvasCoords.y - 1 / this.camera.scale / 2,
      1 / this.camera.scale,
      1 / this.camera.scale);
  }

  drawSelectedRect(x, y) {
    this.ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
    this.ctx.strokeStyle = "red";
    this.ctx.lineWidth = 4;
    const centerCanvasCoords = this.camera.worldToCanvasCoords(x, y);
    this.ctx.strokeRect(centerCanvasCoords.x - 1 / this.camera.scale / 2,
      centerCanvasCoords.y - 1 / this.camera.scale / 2,
      1 / this.camera.scale,
      1 / this.camera.scale);
  }

  drawBoard() {
    this.ctx.clearRect(0, 0, this.state.width, this.state.height);
    this.ctx.fillStyle = 'grey';
    this.ctx.fillRect(0, 0, this.state.width, this.state.height);
    for (let chunkX = 0; chunkX < this.props.knownBoard.length; chunkX += 1) {
      for (let chunkY = 0; chunkY < this.props.knownBoard[chunkX].length; chunkY += 1) {
        const chunk = this.props.knownBoard[chunkX][chunkY];
        if (!!chunk) {
          // chunk is discovered, color it black and draw all planets
          for (let x = chunkX * CHUNK_SIZE; x < (chunkX + 1) * CHUNK_SIZE; x += 1) {
            for (let y = chunkY * CHUNK_SIZE; y < (chunkY + 1) * CHUNK_SIZE; y += 1) {
              this.ctx.fillStyle = 'black';
              this.drawGameObject({
                x,
                y,
                width: 1.1,
                height: 1.1
              });
            }
          }
          for (let planetLoc of chunk.planets) {
            if (!this.props.planets[planetLoc.hash]) {
              this.drawPlanet({
                x: planetLoc.x,
                y: planetLoc.y,
                type: this.PlanetViewTypes.UNOCCUPIED,
                population: 0
              });
            } else if (this.props.planets[planetLoc.hash].owner.toLowerCase() === this.props.myAddress.toLowerCase()) {
              this.drawPlanet({
                x: planetLoc.x,
                y: planetLoc.y,
                type: this.PlanetViewTypes.MINE,
                population: Math.floor(getCurrentPopulation(this.props.planets[planetLoc.hash]) / 100)
              });
            } else {
              this.drawPlanet({
                x: planetLoc.x,
                y: planetLoc.y,
                type: this.PlanetViewTypes.ENEMY,
                population: Math.floor(getCurrentPopulation(this.props.planets[planetLoc.hash]) / 100)
              });
            }
          }
        }
      }
    }
    if (this.state.hoveringOver && this.state.mouseDown) {
      if (!!getPlanetLocationIfKnown(this.state.mouseDown.x, this.state.mouseDown.y, this.props.knownBoard)
        && (this.state.hoveringOver.x !== this.state.mouseDown.x || this.state.hoveringOver.y !== this.state.mouseDown.y)) {
        this.ctx.beginPath();
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = 'white';
        const startCoords = this.camera.worldToCanvasCoords(this.state.mouseDown.x, this.state.mouseDown.y);
        this.ctx.moveTo(startCoords.x, startCoords.y);
        const endCoords = this.camera.worldToCanvasCoords(this.state.hoveringOver.x, this.state.hoveringOver.y);
        this.ctx.lineTo(endCoords.x, endCoords.y);
        this.ctx.stroke();
      }
    }
    if (this.state.hoveringOver) {
      this.drawHoveringRect(this.state.hoveringOver.x, this.state.hoveringOver.y);
    }
    if (this.props.selected) {
      this.drawSelectedRect(this.props.selected.x, this.props.selected.y);
    }
  }

  frame() {
    this.updateGame();
    this.drawGame();
  }

  render() {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <canvas
          ref={this.canvasRef}
          width={this.state.width}
          height={this.state.height}
          style={{ border: '1px solid black '}}
        />
      </div>
    );
  }
}

export default ScrollableBoard;
