import { measureTime } from "../Utils.js";
import Vec from "../Vec.js";

export default class Kmeans {
  constructor(k, dim) {
    if (k === undefined || dim === undefined)
      throw new Error("undefined constructor parameters");
    this.k = k;
    this.dim = dim;
    this.clusters = [];
    for (let i = 0; i < k; i++) {
      this.clusters[i] = Vec.RANDOM(dim);
    }
  }

  _takeRandomDataPointFromCluster(clustersIndexes) {
    const k = Math.floor(Math.random() * this.k);
    if (clustersIndexes[k].length > 0) {
      const sampleIndex = Math.floor(Math.random() * clustersIndexes[k].length);
      return clustersIndexes[k][sampleIndex];
    }
    return this._takeRandomDataPointFromCluster(clustersIndexes);
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
      const prediction = this.predict(data[i]);
      const kIndex = Math.max(
        0,
        prediction.findIndex((x) => x > 0)
      );
      const j = clusterIndex[kIndex].length;
      clusterIndex[kIndex][j] = i;
    }
    // force clusters to have at least one data point
    for (let i = 0; i < this.k; i++) {
      if (clusterIndex[i].length === 0) {
        clusterIndex[i][0] = this._takeRandomDataPointFromCluster(clusterIndex);
      }
    }
    return clusterIndex;
  }

  _updateParameters(dataByClusters, data) {
    for (let i = 0; i < this.k; i++) {
      const clusterDataIndex = dataByClusters[i];
      const n = clusterDataIndex.length;
      let mu = Vec.ZERO(this.dim);
      for (let j = 0; j < n; j++) {
        const rgb = data[clusterDataIndex[j]];
        mu = mu.add(rgb);
      }
      this.clusters[i] = mu.scale(1.0 / n);
    }
  }

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
    this._updateParameters(dataByClusters, data);
    return this;
  }

  /**
   *
   * @param {Vec} data
   * @returns {Vec}
   */
  predict(x) {
    let kIndex = -1;
    let minDistance = Number.MAX_VALUE;
    for (let i = 0; i < this.k; i++) {
      let dist = x.sub(this.clusters[i]).squareLength();
      if (minDistance > dist) {
        minDistance = dist;
        kIndex = i;
      }
    }
    return Vec.e(this.k)(kIndex);
  }
}
