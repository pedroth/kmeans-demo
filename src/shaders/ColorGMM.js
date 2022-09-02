import GMM from "../algorithms/GMM.js";
import { Vec3 } from "../Vec.js";
import {
  getDataFromImagePixels,
  hexToRgb,
  STATES,
  updateShaderOutput,
} from "./ShaderUtils.js";

export default class ColorGMM {
  constructor(k) {
    this.k = k;
    this.gmm = new GMM(k, 3);
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
    return this.gmm.clusters[index].scale(255).toArray();
  }

  /**
   *
   * @param {ArrayBuffer<Number>} imageData: Array<Number> width, height, color
   */
  updateWithImageData(imageData, filter) {
    const data = getDataFromImagePixels(imageData, filter);
    this.gmm.update(data);
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
      const clusterWeights = this.gmm.predict(rgb);
      let expectedColor = Vec3();
      for (let i = 0; i < this.k; i++) {
        const w = clusterWeights.get(i);
        const mu = this.gmm.clusters[i];
        const color = state2lazyColor[this.states[i].type]({
          clusterColor: () => mu.scale(255),
          originalColor: () => rgb.scale(255),
          customColor: () => hexToRgb(this.states[i]?.color),
        });
        expectedColor = expectedColor.add(color.scale(w));
      }
      const outputColor = expectedColor.toArray();
      dataOut[i] = outputColor[0];
      dataOut[i + 1] = outputColor[1];
      dataOut[i + 2] = outputColor[2];
      dataOut[i + 3] = 255;
    }
    canvasOut.paint();
  }

  updateOutput(outputElement) {
    updateShaderOutput(this, outputElement);
  }
}
