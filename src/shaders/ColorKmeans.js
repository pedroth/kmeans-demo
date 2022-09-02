import Kmeans from "../algorithms/Kmeans.js";
import { Vec3 } from "../Vec.js";
import {
  getDataFromImagePixels,
  hexToRgb,
  STATES,
  updateShaderOutput
} from "./ShaderUtils.js";

export default class ColorKmeans {
  constructor(k) {
    this.k = k;
    this.kmeans = new Kmeans(k, 3);
    this.haveGeneratedOutput = false;
    this.states = [...Array(k)].map((_) => ({ type: STATES.CLUSTER }));
  }

  //========================================================================================
  /*                                                                                      *
   *                                        PUBLIC                                        *
   *                                                                                      */
  //========================================================================================

  getNumberOfClusters() {
    return this.k;
  }

  getRGBArrayFromClusterIndex(index) {
    return this.kmeans.clusters[index].scale(255).toArray();
  }

  /**
   *
   * @param {ArrayBuffer<Number>} imageData: Array<Number> width, height, color
   */
  updateWithImageData(imageData, filter) {
    const data = getDataFromImagePixels(imageData, filter);
    this.kmeans.update(data);
  }

  paintImage({ imageData, canvasOut }) {
    const state2lazyColor = {
      [STATES.CLUSTER]: ({ clusterColor }) => clusterColor(),
      [STATES.ORIGINAL]: ({ originalColor }) => originalColor(),
      [STATES.CUSTOM]: ({ customColor }) => customColor(),
    };
    const dataOut = canvasOut.getData();
    for (let i = 0; i < dataOut.length; i += 4) {
      const rgb = Vec3(
        imageData[i] / 255,
        imageData[i + 1] / 255,
        imageData[i + 2] / 255
      );
      const classification = this.kmeans.predict(rgb);
      const index = classification.findIndex((x) => x > 0);
      const color = state2lazyColor[this.states[index].type]({
        clusterColor: () => this.kmeans.clusters[index].scale(255),
        originalColor: () => rgb.scale(255),
        customColor: () => hexToRgb(this.states[index]?.color),
      });
      dataOut[i] = color.get(0);
      dataOut[i + 1] = color.get(1);
      dataOut[i + 2] = color.get(2);
      dataOut[i + 3] = 255;
    }
    canvasOut.paint();
  }

  updateOutput(outputElement) {
    updateShaderOutput(this, outputElement);
  }
}
