import EMeans from "../algorithms/EMeans.js";
import PointCloudKmeans from "./PointCloudKmeans.js";

export default class PointCloudEMeans extends PointCloudKmeans {
  constructor(k, camera) {
    super(k, camera, EMeans);
    this.emeans = this.kmeans;
  }
}
