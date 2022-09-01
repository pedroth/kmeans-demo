import { Vec3 } from "../Vec.js";
import { getDataFromImagePixels } from "./ShaderUtils.js";
import Camera from "../Camera.js";
import Scene from "../Scene.js";

export default class PointCloud {
  constructor() {
    this.camera = new Camera();
    this.scene = new Scene();
    this.haveGeneratedOutput = false;
  }

  _updateSceneWithData(data) {}

  _createOutput(outputElement) {
    outputElement.innerHTML = "";
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
    const dataOut = canvasOut.getData();
    for (let i = 0; i < dataOut.length; i += 4) {
      dataOut[i] = imageData[i];
      dataOut[i + 1] = imageData[i + 1];
      dataOut[i + 2] = imageData[i + 2];
      dataOut[i + 3] = 255;
    }
    canvasOut.paint();
  }

  updateOutput(outputElement) {
    if (!this.haveGeneratedOutput) {
      this._createOutput(outputElement);
      this.haveGeneratedOutput = true;
      return;
    }
  }
}
