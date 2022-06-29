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

  /**
   *
   * @param {Array<Vec>} data
   * @returns {Kmeans}
   */
  update(data) {}

  /**
   *
   * @param {Vec} data
   * @returns {Array<Int>}
   */
  classify(data) {}
}
