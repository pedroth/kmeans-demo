import { powInt } from "../Utils.js";
import Vec from "../Vec.js";

export default class GMM {
  constructor(k, dim) {
    this.k = k;
    this.dim = dim;
    this.sigmas = [];
    this.phis = [];
    this.clusters = [];
    this.UNIFORM = 1 / k;
    for (let i = 0; i < k; i++) {
      this.clusters[i] = Vec.RANDOM(dim);
      this.sigmas[i] = 1 + Math.random();
      this.phis[i] = this.UNIFORM;
    }
  }

  _distributeWeightsAtRandom(weightsPerData, column) {
    const randomIndex = Math.floor(Math.random() * weightsPerData.length);
    weightsPerData[randomIndex] = Vec.e(this.k)(column);
  }

  /**
   *
   * @param {Array<Vec>} data
   * @return {Array<Vec>} weightsPerData
   */
  _getWeightsPerData(data) {
    const weightsPerData = [];
    const weightsPerCluster = new Float32Array(this.k);
    for (let i = 0; i < data.length; i++) {
      const weights = this.predict(data[i]);
      weightsPerData.push(weights);
      for (let j = 0; j < this.k; j++) {
        weightsPerCluster[j] += weights.get(j);
      }
    }
    // force clusters to have at least one data point
    for (let j = 0; j < this.k; j++) {
      if (weightsPerCluster[j] < 1e-5) {
        this._distributeWeightsAtRandom(weightsPerData, j);
      }
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
    for (let j = 0; j < this.k; j++) {
      let mu = Vec.ZERO(this.dim);
      let acc = 0;
      for (let i = 0; i < n; i++) {
        const rgb = data[i];
        const w = weightsPerData[i].get(j);
        mu = mu.add(rgb.scale(w));
        acc += w;
      }
      this.clusters[j] = mu.scale(1 / acc);
      let sigma = 0;
      for (let i = 0; i < n; i++) {
        const rgb = data[i];
        const w = weightsPerData[i].get(j);
        const mu = this.clusters[j];
        sigma += w * rgb.sub(mu).squareLength();
      }
      this.sigmas[j] = sigma / (acc * this.dim);
      this.phis[j] = acc / n;
      // doesn't let it go to zero
      if (this.sigmas[j] < 1e-5) this.sigmas[j] = 1e-5;
    }
  }

  _gaussian(x, mu, sigma) {
    const squareDist = x.sub(mu).squareLength();
    const zeta = Math.sqrt(powInt(2 * Math.PI * sigma, this.dim));
    const prob = Math.exp(-squareDist / (2 * sigma));
    return zeta === 0 ? prob : prob / zeta;
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
      if (acc !== 0) w[i] = w[i] / acc;
    }
    return Vec.fromArray(w);
  }
}
