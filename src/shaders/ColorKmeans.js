import Kmeans from "../algorithms/Kmeans.js";
import Vec, { Vec3 } from "../Vec.js";

export default class ColorKmeans {
  constructor(k) {
    this.k = k;
    this.kmeans = new Kmeans(k, 3);
    this.indexVector = new Vec(
      [...Array(this.k)].map((_, i) => i),
      true
    );
  }

  //========================================================================================
  /*                                                                                      *
   *                                        PRIVATE                                       *
   *                                                                                      */
  //========================================================================================
  /**
   *
   * @param {Array<Number>} imageData
   * @returns {Array<Vec3>}
   */
  getDataFromImagePixels(imageData) {
    const data = [];
    let j = 0;
    for (let i = 0; i < imageData.length; i += 4) {
      data[j++] = Vec3(
        imageData[i] / 255,
        imageData[i + 1] / 255,
        imageData[i + 2] / 255
      );
    }
    return data;
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
  updateWithImageData(imageData) {
    const data = this.getDataFromImagePixels(imageData);
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
      const index = Math.floor(classification.dot(this.indexVector));
      const colorCluster = this.kmeans.clusters[index].scale(255);
      const newColor = colorCluster.map(Math.floor)._vec;
      // console.log("DEBUG: classification", classification, newColor);
      dataOut[i] = newColor[0];
      dataOut[i + 1] = newColor[1];
      dataOut[i + 2] = newColor[2];
      dataOut[i + 3] = 255;
    }
    canvasOut.paint();
  }
}
