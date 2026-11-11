import EMeans from "../algorithms/EMeans.js";
import ColorKmeans from "./ColorKmeans.js";

export default class ColorEmeans extends ColorKmeans {
  constructor(k) {
    super(k, EMeans);
    this.emeans = this.kmeans;
  }
}
