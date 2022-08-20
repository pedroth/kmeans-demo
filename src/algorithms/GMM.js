import { powInt } from "../Utils.js";
import Vec from "../Vec.js";

export default class GMM {
  constructor(k, dim) {
    this.k = k;
    this.dim = dim;
    this.sigmas = [];
    this.phis = [];
    this.clusters = [];
    const UNIFORM = 1 / k;
    for (let i = 0; i < k; i++) {
      this.clusters[i] = Vec.RANDOM(dim);
      this.sigmas[i] = Math.random();
      this.phis[i] = UNIFORM;
    }
  }

  /**
   *
   * @param {Array<Vec>} data
   * @return {Array<Vec>} weightsPerData
   */
  _getWeightsPerData(data) {
    const weightsPerData = [];
    for (let i = 0; i < data.length; i++) {
      const weights = this.predict(data[i]);
      weightsPerData.push(weights);
    }
    return weightsPerData;
  }

  /**
   *
   * @param {*} weightsPerData
   * @param {*} data
   */
  _updateParameters(weightsPerData, data) {
    const n = data.length;
    for (let i = 0; i < this.k; i++) {
      let mu = Vec.ZERO(this.dim);
      let acc = 0;
      for (let j = 0; j < n; j++) {
        const rgb = data[j];
        const w = weightsPerData[j].get(i);
        mu = mu.add(rgb.scale(w));
        acc += w;
      }
      this.clusters[i] = mu.scale(1 / acc);
      let sigma = 0;
      for (let j = 0; j < n; j++) {
        const rgb = data[j];
        const w = weightsPerData[j].get(i);
        const mu = this.clusters[i];
        sigma += w * mu.sub(rgb).squareLength();
      }
      this.sigmas[i] = Math.sqrt(sigma / acc);
      this.phis[i] = acc / n;
    }
  }

  _gaussian(x, mu, sigma) {
    let dist = x.sub(mu).length();
    return (
      Math.exp(-((dist * dist) / (2 * sigma * sigma))) /
      (Math.sqrt(2 * Math.PI) * sigma)
    );
  }

  //========================================================================================
  /*                                                                                      *
   *                                      PUBLIC API                                      *
   *                                                                                      */
  //========================================================================================

  /**
   *
   * @param {Array<Vec>} data
   * @returns {GMM}
   */
  update(data) {
    const weightsPerData = this._getWeightsPerData(data);
    this._updateParameters(weightsPerData, data);
    return this;
  }

  /**
   *
   * @param {Vec} data
   * @returns {Array<Number>}
   */
  predict(x) {
    let w = [];
    let acc = 0;
    for (let i = 0; i < this.k; i++) {
      w[i] = this._gaussian(x, this.clusters[i], this.sigmas[i]) * this.phis[i];
      acc += w[i];
    }
    for (let i = 0; i < this.k; i++) {
      w[i] = w[i] / acc;
    }
    return Vec.fromArray(w);
  }
}
