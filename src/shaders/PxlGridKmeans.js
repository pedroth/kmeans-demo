import Kmeans from "../algorithms/Kmeans.js";
import { CANVAS_SIZE } from "../Utils.js";
import Vec from "../Vec.js";
import { COLOR_DIM, MAX_CANVAS_INDEX, updateGridShaderOutput } from "./ShaderUtils.js";

export default class PxlGridKmeans {
  constructor(k, gridSize = 9) {
    this.k = k;
    this.gridSize = gridSize;
    this.outputCanvasSize = this.gridSize * 20;
    this.dim = this.gridSize * this.gridSize * COLOR_DIM;
    // clusters are grid^3 dimensional vectors which index represents colors in row major
    this.kmeans = new Kmeans(k, this.dim);
    this.haveGeneratedOutput = false;
  }

  _getColorFromDataPoint(testPoint) {
    const classification = this.kmeans.predict(testPoint);
    const index = classification.findIndex((x) => x > 0);
    return this.kmeans.clusters[index].scale(255).toArray();
  }

  _getGridVec(i, j, imageData, width = CANVAS_SIZE.width) {
    const gridData = [];
    const index = 4 * (i * width + j);
    for (let dx = 0; dx < this.gridSize; dx++) {
      for (let dy = 0; dy < this.gridSize; dy++) {
        const innerIndex = index + 4 * (dx * width + dy);
        const r = imageData[Math.min(innerIndex, MAX_CANVAS_INDEX)] / 255;
        const g = imageData[Math.min(innerIndex + 1, MAX_CANVAS_INDEX)] / 255;
        const b = imageData[Math.min(innerIndex + 2, MAX_CANVAS_INDEX)] / 255;
        gridData.push(r);
        gridData.push(g);
        gridData.push(b);
      }
    }
    return Vec.fromArray(gridData);
  }

  _getDataFromImagePixels(
    imageData,
    filter,
    width = CANVAS_SIZE.width,
    height = CANVAS_SIZE.height
  ) {
    const data = [];
    let k = 0;
    for (let i = 0; i < width; i += this.gridSize) {
      for (let j = 0; j < height; j += this.gridSize) {
        if (filter()) {
          data[k++] = this._getGridVec(i, j, imageData);
        }
      }
    }
    return data;
  }

  _paintDataWithColorGrid(
    i,
    j,
    colorGrid,
    canvasData,
    width = CANVAS_SIZE.width
  ) {
    const index = 4 * (i * width + j);
    for (let dx = 0; dx < this.gridSize; dx++) {
      for (let dy = 0; dy < this.gridSize; dy++) {
        const innerIndex = index + 4 * (dx * width + dy);
        const colorGridIndex = COLOR_DIM * (dy + this.gridSize * dx);
        canvasData[innerIndex] = colorGrid[colorGridIndex];
        canvasData[innerIndex + 1] = colorGrid[colorGridIndex + 1];
        canvasData[innerIndex + 2] = colorGrid[colorGridIndex + 2];
        canvasData[innerIndex + 3] = 255;
      }
    }
  }

 


  //========================================================================================
  /*                                                                                      *
   *                                        PUBLIC                                        *
   *                                                                                      */
  //========================================================================================

  getNumberOfClusters() {
    return this.k;
  }

  getGridArrayFromClusterIndex(index) {
    return this.kmeans.clusters[index].scale(255).toArray();
  }

  /**
   *
   * @param {ArrayBuffer<Number>} imageData: Array<Number> width, height, color
   */
  updateWithImageData(imageData, filter) {
    const data = this._getDataFromImagePixels(imageData, filter);
    this.kmeans.update(data);
  }

  paintImage({ imageData, canvasOut }) {
    const dataOut = canvasOut.getData();
    for (let i = 0; i < CANVAS_SIZE.height; i += this.gridSize) {
      for (let j = 0; j < CANVAS_SIZE.width; j += this.gridSize) {
        const testData = this._getGridVec(i, j, imageData);
        const colorGrid = this._getColorFromDataPoint(testData);
        this._paintDataWithColorGrid(i, j, colorGrid, dataOut);
      }
    }
    canvasOut.paint();
  }

  updateOutput(outputElement) {
    updateGridShaderOutput(this, outputElement);
  }
}
