import Vec from "../Vec.js";

const INITIAL_COUNT = 1e-10;
const DEFAULT_OPTIONS = {
  alpha0: 0.1,
  epochs: 25,
  minStepFraction: 0.1,
  revivalInterval: 5,
  deadClusterThreshold: 0.1,
};

export default class EMeans {
  constructor(k, dim, options = {}) {
    if (!Number.isInteger(k) || k < 1 || !Number.isInteger(dim) || dim < 1) {
      throw new Error("k and dim must be positive integers");
    }
    this.k = k;
    this.dim = dim;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    if (
      !Number.isFinite(this.options.alpha0) ||
      this.options.alpha0 <= 0 ||
      this.options.alpha0 > 1 ||
      !Number.isInteger(this.options.epochs) ||
      this.options.epochs < 1 ||
      !Number.isFinite(this.options.minStepFraction) ||
      this.options.minStepFraction < 0 ||
      this.options.minStepFraction > 1 ||
      !Number.isInteger(this.options.revivalInterval) ||
      this.options.revivalInterval < 1 ||
      !Number.isFinite(this.options.deadClusterThreshold) ||
      this.options.deadClusterThreshold < 0
    ) {
      throw new Error("invalid e-means options");
    }
    this.clusters = Array.from({ length: k }, () => Vec.RANDOM(dim));
    this.counts = new Float64Array(k).fill(INITIAL_COUNT);
    this.sums = this.clusters.map((cluster) => cluster.scale(INITIAL_COUNT));
    this.iterations = 0;
    this.isInitialized = false;
  }

  _initialize(data) {
    const indexes = Array.from({ length: data.length }, (_, i) => i);
    const uniqueCount = Math.min(this.k, data.length);
    for (let i = 0; i < uniqueCount; i++) {
      const randomIndex = i + Math.floor(Math.random() * (data.length - i));
      [indexes[i], indexes[randomIndex]] = [indexes[randomIndex], indexes[i]];
      this.clusters[i] = data[indexes[i]];
    }
    for (let i = uniqueCount; i < this.k; i++) {
      this.clusters[i] = data[Math.floor(Math.random() * data.length)];
    }
    this.sums = this.clusters.map((cluster) => cluster.scale(INITIAL_COUNT));
    this.counts.fill(INITIAL_COUNT);
    this.isInitialized = true;
  }

  _nearestClusterIndex(x) {
    let nearestIndex = 0;
    let minDistance = Number.POSITIVE_INFINITY;
    for (let j = 0; j < this.k; j++) {
      const cluster = this.clusters[j];
      let distance = 0;
      for (let d = 0; d < this.dim; d++) {
        const difference = x.get(d) - cluster.get(d);
        distance += difference * difference;
      }
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = j;
      }
    }
    return [nearestIndex, minDistance];
  }

  _getStepSize() {
    const progress = Math.min(this.iterations / this.options.epochs, 1);
    const cosineDecay = 0.5 * (1 + Math.cos(Math.PI * progress));
    return (
      this.options.alpha0 *
      (this.options.minStepFraction +
        (1 - this.options.minStepFraction) * cosineDecay)
    );
  }

  _reviveDeadClusters(farthestPoints) {
    let totalCount = 0;
    let donorIndex = 0;
    for (let j = 0; j < this.k; j++) {
      totalCount += this.counts[j];
      if (this.counts[j] > this.counts[donorIndex]) donorIndex = j;
    }
    const meanCount = totalCount / this.k;
    const deadThreshold = this.options.deadClusterThreshold * meanCount;
    if (this.counts[donorIndex] <= deadThreshold) return;

    for (let j = 0; j < this.k; j++) {
      if (j === donorIndex || this.counts[j] >= deadThreshold) continue;
      const seed = farthestPoints[donorIndex];
      if (!seed) continue;
      this.clusters[j] = seed;
      this.counts[j] = Math.max(
        INITIAL_COUNT,
        this.counts[donorIndex] * this.options.deadClusterThreshold
      );
      this.sums[j] = seed.scale(this.counts[j]);
    }
  }

  update(data) {
    if (data.length === 0) return this;
    for (const point of data) {
      if (!point || point.dim !== this.dim) {
        throw new Error(`expected data points with dimension ${this.dim}`);
      }
    }
    if (!this.isInitialized) this._initialize(data);

    const batchCounts = new Float64Array(this.k);
    const batchSums = Array.from(
      { length: this.k },
      () => new Float64Array(this.dim)
    );
    const farthestDistances = new Float64Array(this.k);
    const farthestPoints = Array(this.k);
    for (const point of data) {
      const [clusterIndex, distance] = this._nearestClusterIndex(point);
      batchCounts[clusterIndex]++;
      for (let d = 0; d < this.dim; d++) {
        batchSums[clusterIndex][d] += point.get(d);
      }
      if (
        !farthestPoints[clusterIndex] ||
        distance > farthestDistances[clusterIndex]
      ) {
        farthestDistances[clusterIndex] = distance;
        farthestPoints[clusterIndex] = point;
      }
    }

    const stepSize = this._getStepSize();
    const decay = 1 - stepSize;
    for (let j = 0; j < this.k; j++) {
      this.counts[j] =
        decay * this.counts[j] + stepSize * batchCounts[j];
      const sum = this.sums[j].toArray();
      for (let d = 0; d < this.dim; d++) {
        sum[d] = decay * sum[d] + stepSize * batchSums[j][d];
      }
      this.sums[j] = Vec.fromArray(sum);
      if (this.counts[j] > 0) {
        this.clusters[j] = this.sums[j].scale(1 / this.counts[j]);
      }
    }

    this.iterations++;
    if (this.iterations % this.options.revivalInterval === 0) {
      this._reviveDeadClusters(farthestPoints);
    }
    return this;
  }

  predict(x) {
    const [clusterIndex] = this._nearestClusterIndex(x);
    return Vec.e(this.k)(clusterIndex);
  }
}
