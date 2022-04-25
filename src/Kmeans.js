import Vec from "./Vec.js";

export default class Kmeans {
  constructor(k, dim) {
    this.k = k;
    this.clusters = [];
    for (let i = 0; i < k; i++) {
      this.clusters[i] = Vec.RANDOM(dim);
    }
  }

  /**
   *
   * @param {Array<Vec>} data
   * @returns {Kmeans}
   */
  update(data) {
    for(let i = 0; i < data.length; i++) {
        
    }
  }

  /**
   *
   * @param {Vec} data
   * @returns {Array<Int>}
   */
  classify(x) {
    let kIndex = -1;
    let minDistance = Number.MAX_VALUE;
    for (let i = 0; i < this.k; i++) {
      let dist = x.sub(this.clusters[i]).length();
      if (minDistance > dist) {
        minDistance = dist;
        kIndex = i;
      }
    }
    return kIndex;
  }
}
