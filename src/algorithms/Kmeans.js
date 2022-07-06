import Vec, { Vec3 } from "./Vec.js";

export default class Kmeans {
  constructor(k, dim) {
    this.k = k;
    this.dim = dim;
    this.clusters = [];
    for (let i = 0; i < k; i++) {
      this.clusters[i] = Vec.RANDOM(dim);
    }
  }

  /**
   *
   * @param {Array<Vec>} data
   * @returns {Array<Integer>}
   */
  _clusterData(data) {
    const clusterIndex = [];
    for (let i = 0; i < this.k; i++) {
      clusterIndex[i] = [];
    }
    for (let i = 0; i < data.length; i++) {
      let kIndex = this._getClusterIndexFromPrediction(this.predict(data[i]));
      let j = clusterIndex[kIndex].length;
      clusterIndex[kIndex][j] = i;
    }
    return clusterIndex;
  }

  _getClusterIndexFromPrediction(vector) {
    const prediction = vector._vec;
    for (let i = 0; i < prediction.length; i++) {
      if (prediction[i] === 1.0) return i;
    }
  }

  _updateParameters() {}

  //========================================================================================
  /*                                                                                      *
   *                                      PUBLIC API                                      *
   *                                                                                      */
  //========================================================================================

  /**
   *
   * @param {Array<Vec>} data
   * @returns {Kmeans}
   */
  update(data) {
    const dataByClusters = this._clusterData(data);
    this._updateParameters(dataByClusters);
    return this;
  }

  /**
   *
   * @param {Vec} data
   * @returns {Array<Number>}
   */
  predict(x) {
    let kIndex = -1;
    let minDistance = Number.MAX_VALUE;
    for (let i = 0; i < this.k; i++) {
      let dist = x.sub(this.clusters[i]).length();
      if (minDistance > dist) {
        minDistance = dist;
        kIndex = i;
      }
    }
    return Vec.e(this.dim)(kIndex);
  }
}
