import Kmeans from "../algorithms/Kmeans.js";
import { Vec3 } from "../Vec.js";
import { getDataFromImagePixels } from "./ShaderUtils.js";

export default class ColorKmeans {
  constructor(k) {
    this.k = k;
    this.kmeans = new Kmeans(k, 3);
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
    this.kmeans.update(data);
  }

  paintImage({ imageData, canvasOut }) {
    const dataOut = canvasOut.getData();
    for (let i = 0; i < dataOut.length; i += 4) {
      const rgb = Vec3(
        imageData[i] / 255,
        imageData[i + 1] / 255,
        imageData[i + 2] / 255
      );
      const classification = this.kmeans.predict(rgb);
      const index = classification.findIndex((x) => x > 0);
      const colorCluster = this.kmeans.clusters[index].scale(255);
      const outputColor = colorCluster.map(Math.floor).toArray();
      dataOut[i] = outputColor[0];
      dataOut[i + 1] = outputColor[1];
      dataOut[i + 2] = outputColor[2];
      dataOut[i + 3] = 255;
    }
    canvasOut.paint();
  }
}