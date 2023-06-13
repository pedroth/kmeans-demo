import GMM from "../algorithms/GMM.js";
import { CANVAS_SIZE } from "../Utils.js";
import Vec from "../Vec.js";
import { COLOR_DIM, MAX_CANVAS_INDEX, updateGridShaderOutput, GRID_OUTPUT_SIZE_MULTIPLIER } from "./ShaderUtils.js";

export default class PxlGridGMM {
  constructor(k, gridSize = 9) {
    this.k = k;
    this.gridSize = gridSize;
    this.outputCanvasSize = this.gridSize * GRID_OUTPUT_SIZE_MULTIPLIER;
    this.dim = this.gridSize * this.gridSize * COLOR_DIM;
    this.gridColorIndex = Math.floor(this.dim / 2) - 1
    // clusters are grid^3 dimensional vectors which index represents colors in row major
    this.gmm = new GMM(k, this.dim);
    this.haveGeneratedOutput = false;
  }

  _getColorFromDataPoint(testPoint) {
    const clusterWeights = this.gmm.predict(testPoint);
    let expectedGridImage = Vec.ZERO(this.dim);
    for (let i = 0; i < this.k; i++) {
      const w = clusterWeights.get(i);
      const mu = this.gmm.clusters[i];
      expectedGridImage = expectedGridImage.add(mu.scale(w));
    }
    return expectedGridImage.scale(255).toArray();
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
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
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
    return this.gmm.clusters[index].scale(255).toArray();
  }

  /**
   *
   * @param {ArrayBuffer<Number>} imageData: Array<Number> width, height, color
   */
  updateWithImageData(imageData, filter) {
    const data = this._getDataFromImagePixels(imageData, filter);
    this.gmm.update(data);
  }

  paintImage({ imageData, canvasOut }) {
    const dataOut = canvasOut.getData();
    for (let i = 0; i < CANVAS_SIZE.height; i++) {
      for (let j = 0; j < CANVAS_SIZE.width; j++) {
        const testData = this._getGridVec(i, j, imageData);
        const colorGrid = this._getColorFromDataPoint(testData);
        const index = 4 * (i * CANVAS_SIZE.width + j);
        dataOut[index] = colorGrid[this.gridColorIndex];
        dataOut[index + 1] = colorGrid[this.gridColorIndex + 1];
        dataOut[index + 2] = colorGrid[this.gridColorIndex + 2];
        dataOut[index + 3] = 255;
      }
    }
    canvasOut.paint();
  }

  updateOutput(outputElement) {
    updateGridShaderOutput(this, outputElement);
  }
}
