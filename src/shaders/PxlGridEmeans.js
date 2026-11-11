import EMeans from "../algorithms/EMeans.js";
import PxlGridKmeans from "./PxlGridKmeans.js";

export default class PxlGridEmeans extends PxlGridKmeans {
  constructor(k, gridSize = 9) {
    super(k, gridSize, EMeans);
    this.emeans = this.kmeans;
  }
}
