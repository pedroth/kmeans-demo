import GMM from "../algorithms/GMM.js";
import { Vec3 } from "../Vec.js";
import { getDataFromImagePixels } from "./ShaderUtils.js";

export default class ColorGMM {
  constructor(k) {
    this.k = k;
    this.gmm = new GMM(k, 3);
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
    this.gmm.update(data);
  }

  paintImage({ imageData, canvasOut }) {
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
        expectedColor = expectedColor.add(mu.scale(w));
      }
      const outputColor = expectedColor.scale(255).map(Math.floor).toArray();
      dataOut[i] = outputColor[0];
      dataOut[i + 1] = outputColor[1];
      dataOut[i + 2] = outputColor[2];
      dataOut[i + 3] = 255;
    }
    canvasOut.paint();
  }
}
