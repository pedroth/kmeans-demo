import Camera from "../Camera.js";
import Scene from "../Scene.js";
import { Vec2, Vec3 } from "../Vec.js";
import { getDataFromImagePixels } from "./ShaderUtils.js";

const CUBE = [
  Vec3(0, 0, 0),
  Vec3(1, 0, 0),
  Vec3(0, 1, 0),
  Vec3(1, 1, 0),
  Vec3(0, 0, 1),
  Vec3(1, 0, 1),
  Vec3(0, 1, 1),
  Vec3(1, 1, 1),
];

const CUBE_EDGES_INDEXES = [
  [0, 1],
  [0, 2],
  [0, 4],
  [1, 3],
  [1, 5],
  [2, 3],
  [2, 6],
  [3, 7],
  [4, 5],
  [4, 6],
  [5, 7],
  [6, 7],
];

export default class PointCloud {
  constructor() {
    this.camera = new Camera({
      distanceToPlane: 0.1,
      focalPoint: Vec3(0.5, 0.5, 0.5),
    });
    this.scene = new Scene();
    this.mouse = Vec2();
    this.isMouseDown = false;
    this.haveGeneratedOutput = false;
    this.haveSetUpCanvas = false;
    CUBE_EDGES_INDEXES.forEach(([i, j]) => {
      this.scene.addElement(
        Scene.Line.builder()
          .name(`cube-${i}_${j}`)
          .start(CUBE[i])
          .end(CUBE[j])
          .color(255, 255, 255, 255)
          .build()
      );
    });
  }

  _updateSceneWithData(data) {
    for (let i = 0; i < data.length; i++) {
      const rgb = data[i].scale(255).toArray();
      this.scene.addElement(
        Scene.Point.builder()
          .name(`rgb${i}`)
          .color(...rgb)
          .radius(2)
          .position(data[i])
          .build()
      );
    }
  }

  _createOutput(outputElement) {
    outputElement.innerHTML = "";
  }

  _mouseDown(mouseVec2) {
    this.mouse = mouseVec2;
    this.isMouseDown = true;
  }

  _mouseMove(newMouse, canvas) {
    if (!this.isMouseDown || newMouse.equals(this.mouse)) {
      return;
    }
    const [dx, dy] = newMouse.sub(this.mouse).toArray();
    this.camera.param = this.camera.param.add(
      Vec3(
        0,
        -2 * Math.PI * (dy / canvas.width),
        2 * Math.PI * (dx / canvas.height)
      )
    );
    this.mouse = newMouse;
  }

  _mouseUp() {
    this.isMouseDown = false;
  }

  _mouseWheel({ deltaY }) {
    this.camera.param = this.camera.param.add(Vec3(deltaY * 0.01, 0, 0));
  }

  _setUpCanvas(canvas) {
    canvas.onMouseDown((e) => this._mouseDown(e));
    canvas.onMouseMove((e) => this._mouseMove(e, canvas));
    canvas.onMouseUp(() => this._mouseUp());
    canvas.onMouseWheel((e) => this._mouseWheel(e));
  }

  //========================================================================================
  /*                                                                                      *
   *                                        PUBLIC                                        *
   *                                                                                      */
  //========================================================================================

  /**
   *
   * @param {ArrayBuffer<Number>} imageData: Array<Number> width, height, color
   */
  updateWithImageData(imageData, filter) {
    const data = getDataFromImagePixels(imageData, filter);
    this._updateSceneWithData(data);
  }

  paintImage({ imageData, canvasOut }) {
    if (!this.haveSetUpCanvas) {
      this._setUpCanvas(canvasOut);
      this.haveSetUpCanvas = true;
    }
    this.camera.orbit();
    canvasOut.fill();
    this.camera.sceneShot(this.scene).to(canvasOut);

    // const dataOut = canvasOut.getData();
    // for (let i = 0; i < dataOut.length; i += 4) {
    //   dataOut[i] = imageData[i];
    //   dataOut[i + 1] = imageData[i + 1];
    //   dataOut[i + 2] = imageData[i + 2];
    //   dataOut[i + 3] = 255;
    // }
    // canvasOut.paint();
  }

  updateOutput(outputElement) {
    if (!this.haveGeneratedOutput) {
      this._createOutput(outputElement);
      this.haveGeneratedOutput = true;
      return;
    }
  }
}
