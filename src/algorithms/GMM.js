import Vec from "./Vec.js";

export default class GMM {
  constructor(k, dim) {
    this.k = k;
    this.sigmas = [];
    this.phis = [];
    this.mus = [];
    const UNIFORM = 1 / k;
    for (let i = 0; i < k; i++) {
      this.mus[i] = Vec.RANDOM(dim);
      this.sigmas[i] = Math.random();
      this.phis[i] = UNIFORM;
    }
  }

  //========================================================================================
  /*                                                                                      *
   *                                      PUBLIC API                                      *
   *                                                                                      */
  //========================================================================================

  updateWithImageData(imageData) {
    const data = this._getDataFromImage(imageData);
    const dataByClusters = this._clusterData(data);
    this._updateParameters(dataByClusters);
    return this;
  }

  /**
   *
   * @param {Vec} data
   * @returns {Array<Int>}
   */
  predict(data) {}
}
