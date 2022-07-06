export default class ColorKmeans {
  constructor(k) {
    this.k = k;
  }

  /**
   *
   * @param {ArrayBuffer<Number>} imageData: Array<Number> width, height, color
   */
  updateWithImageData(imageData) {}

  /**
   *
   * @param {Array<Number>} imageData
   * @returns {Array<Vec3>}
   */
  getDataFromImagePixels(imageData) {
    const data = [];
    const k = 0;
    for (let i = 0; i < imageData.length; i += 4) {
      data[k++] = Vec3(imageData[i], imageData[i + 1], imageData[i + 2]);
    }
    return data;
  }
}
