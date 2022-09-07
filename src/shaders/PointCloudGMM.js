import GMM from "../algorithms/GMM.js";
import Camera from "../Camera.js";
import Scene from "../Scene.js";
import Vec, { Vec2, Vec3 } from "../Vec.js";
import {
  getDataFromImagePixels,
  hexToRgb,
  STATES,
  updateShaderOutput,
} from "./ShaderUtils.js";

const CLUSTER_PXL_RADIUS = 4;
const CLUSTER_PXL_BOUNDARY_COLOR = [255, 0, 0, 255];

const CUBE = [
  Vec3(0, 0, 0),
  Vec3(1, 0, 0),
  Vec3(0, 1, 0),
  Vec3(1, 1, 0),
  Vec3(0, 0, 1),
  Vec3(1, 0, 1),
  Vec3(0, 1, 1),
  Vec3(1, 1, 1),
];

const CUBE_EDGES_INDEXES = [
  [0, 1],
  [0, 2],
  [0, 4],
  [1, 3],
  [1, 5],
  [2, 3],
  [2, 6],
  [3, 7],
  [4, 5],
  [4, 6],
  [5, 7],
  [6, 7],
];

const state2lazyColor = {
  [STATES.CLUSTER]: ({ clusterColor }) => clusterColor(),
  [STATES.ORIGINAL]: ({ originalColor }) => originalColor(),
  [STATES.CUSTOM]: ({ customColor }) => customColor(),
};

export default class PointCloudGMM {
  constructor(k) {
    // model vars
    this.k = k;
    this.gmm = new GMM(k, 3);

    // output vars
    this.states = [...Array(k)].map((_) => ({ type: STATES.CLUSTER }));

    // scene vars
    this.camera = new Camera({
      distanceToPlane: 0.1,
      focalPoint: Vec3(0.5, 0.5, 0.5),
    });
    this.scene = new Scene();
    this.mouse = Vec2();
    this.isMouseDown = false;
    this.haveSetUpCanvas = false;
  }

  _getCubeEdgeColor(endVertex) {
    return endVertex.scale(255).toArray();
  }

  _addCube2Scene() {
    CUBE_EDGES_INDEXES.forEach(([i, j]) => {
      const vertexI = CUBE[i];
      const vertexJ = CUBE[j];
      const rgb = [...this._getCubeEdgeColor(vertexJ), 255];
      this.scene.addElement(
        Scene.Line.builder()
          .name(`cube-${i}_${j}`)
          .start(vertexI)
          .end(vertexJ)
          .color(...rgb)
          .build()
      );
    });
  }

  _addClusters2Scene() {
    for (let i = 0; i < this.k; i++) {
      const rgb = [...this.getRGBArrayFromClusterIndex(i), 255];
      this.scene.addElement(
        Scene.Point.builder()
          .name(`rgbCluster${i}`)
          .color(...rgb)
          .radius(CLUSTER_PXL_RADIUS)
          .disableDepthBuffer(true)
          .shader(({ dx, dy }) =>
            Math.abs(dx) === CLUSTER_PXL_RADIUS - 1 ||
            Math.abs(dy) === CLUSTER_PXL_RADIUS - 1
              ? CLUSTER_PXL_BOUNDARY_COLOR
              : rgb
          )
          .position(this.gmm.clusters[i])
          .build()
      );
    }
  }

  _getColorFromDataPoint(testPoint) {
    const clusterWeights = this.gmm.predict(testPoint);
    let expectedColor = Vec3();
    for (let i = 0; i < this.k; i++) {
      const w = clusterWeights.get(i);
      const mu = this.gmm.clusters[i];
      const color = state2lazyColor[this.states[i].type]({
        clusterColor: () => mu.scale(255),
        originalColor: () => testPoint.scale(255),
        customColor: () => hexToRgb(this.states[i]?.color),
      });
      expectedColor = expectedColor.add(color.scale(w));
    }
    return expectedColor;
  }

  _addPointCloudData2Scene(data) {
    for (let i = 0; i < data.length; i++) {
      const rgb = [...this._getColorFromDataPoint(data[i]).toArray(), 255];
      this.scene.addElement(
        Scene.Point.builder()
          .name(`rgb${i}`)
          .color(...rgb)
          .radius(1)
          .position(data[i])
          .build()
      );
    }
  }

  _getCircleIn(position, normal, radius, samples = 10) {
    const tau = 2 * Math.PI;
    normal = normal.normalize();
    const pivot = normal.findIndex((x) => x > 0);
    const pvalue = normal.get(pivot);
    const s1 = -normal.get((pivot + 1) % 3);
    const s2 = -normal.get((pivot + 2) % 3);
    const u = Vec.e(3)(pivot)
      .scale(s1)
      .add(Vec.e(3)((pivot + 1) % 3).scale(pvalue))
      .normalize();
    const v = Vec.e(3)(pivot)
      .scale(s2)
      .add(Vec.e(3)((pivot + 2) % 3).scale(pvalue))
      .normalize();
    const circle = [...Array(samples)].map((_, i) => {
      const t = i / (samples - 1);
      return position.add(
        u
          .scale(radius * Math.cos(tau * t))
          .add(v.scale(radius * Math.sin(tau * t)))
      );
    });
    circle.push(circle[0]);
    return circle;
  }

  _addSigmas2Scene() {
    for (let i = 0; i < this.k; i++) {
      const rgb = [255, 255, 0, 255];
      const sigma = this.gmm.sigmas[i];
      const radius = Math.pow(sigma, 1 / this.gmm.dim);
      this.scene.addElement(
        Scene.Path.builder()
          .name(`sigma-vertical${i}`)
          .path(this._getCircleIn(this.gmm.clusters[i], Vec3(1, 0, 0), radius))
          .color(...rgb)
          .build()
      );
      this.scene.addElement(
        Scene.Path.builder()
          .name(`sigma-horizontal${i}`)
          .path(this._getCircleIn(this.gmm.clusters[i], Vec3(0, 0, 1), radius))
          .color(...rgb)
          .build()
      );
      // this.scene.addElement(
      //   Scene.Path.builder()
      //     .name(`phis-horizontal${i}`)
      //     .path(
      //       this._getCircleIn(
      //         this.gmm.clusters[i],
      //         Vec3(0, 1, 0),
      //         this.gmm.phis[i] / 2
      //       )
      //     )
      //     .color(255, 0, 0, 255)
      //     .build()
      // );
    }
  }

  _updateSceneWithData(data) {
    this.scene.clear();
    this._addCube2Scene();
    this._addPointCloudData2Scene(data);
    this._addClusters2Scene();
    this._addSigmas2Scene();
  }

  _createOutput(outputElement) {
    outputElement.innerHTML = "";
  }

  _mouseDown(mouseVec2) {
    this.mouse = mouseVec2;
    this.isMouseDown = true;
  }

  _mouseMove(newMouse, canvas) {
    if (!this.isMouseDown || newMouse.equals(this.mouse)) {
      return;
    }
    const [dx, dy] = newMouse.sub(this.mouse).toArray();
    this.camera.param = this.camera.param.add(
      Vec3(
        0,
        -2 * Math.PI * (dy / canvas.width),
        2 * Math.PI * (dx / canvas.height)
      )
    );
    this.mouse = newMouse;
  }

  _mouseUp() {
    this.isMouseDown = false;
  }

  _mouseWheel({ deltaY }) {
    this.camera.param = this.camera.param.add(Vec3(deltaY * 0.01, 0, 0));
  }

  _setUpCanvas(canvas) {
    canvas.onMouseDown((e) => this._mouseDown(e));
    canvas.onMouseMove((e) => this._mouseMove(e, canvas));
    canvas.onMouseUp(() => this._mouseUp());
    canvas.onMouseWheel((e) => this._mouseWheel(e));
  }

  //========================================================================================
  /*                                                                                      *
   *                                        PUBLIC                                        *
   *                                                                                      */
  //========================================================================================

  getNumberOfClusters() {
    return this.k;
  }

  getRGBArrayFromClusterIndex(index) {
    return this.gmm.clusters[index].scale(255).toArray();
  }

  /**
   *
   * @param {ArrayBuffer<Number>} imageData: Array<Number> width, height, color
   */
  updateWithImageData(imageData, filter) {
    const data = getDataFromImagePixels(imageData, filter);
    this.gmm.update(data);
    this._updateSceneWithData(data);
  }

  paintImage({ imageData, canvasOut }) {
    if (!this.haveSetUpCanvas) {
      this._setUpCanvas(canvasOut);
      this.haveSetUpCanvas = true;
    }
    this.camera.orbit();
    canvasOut.fill();
    this.camera.sceneShot(this.scene).to(canvasOut);
  }

  updateOutput(outputElement) {
    updateShaderOutput(this, outputElement);
  }
}
