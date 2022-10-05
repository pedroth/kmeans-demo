import Kmeans from "../algorithms/Kmeans.js";
import Camera from "../Camera.js";
import Scene from "../Scene.js";
import { Vec2, Vec3 } from "../Vec.js";
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

export default class PointCloudKmeans {
  constructor(k, camera) {
    // model vars
    this.k = k;
    this.kmeans = new Kmeans(k, 3);

    // output vars
    this.states = [...Array(k)].map((_) => ({ type: STATES.CLUSTER }));

    // scene vars
    this.camera =
      camera ||
      new Camera({
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
      const rgb = this._getCubeEdgeColor(vertexJ);
      this.scene.addElement(
        Scene.Line.builder()
          .name(`cube-${i}_${j}`)
          .start(vertexI)
          .end(vertexJ)
          .color(...rgb, 255)
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
          .position(this.kmeans.clusters[i])
          .build()
      );
    }
  }

  _getColorFromDataPoint(testPoint) {
    const classification = this.kmeans.predict(testPoint);
    const index = classification.findIndex((x) => x > 0);
    const color = state2lazyColor[this.states[index].type]({
      clusterColor: () => this.kmeans.clusters[index].scale(255),
      originalColor: () => testPoint.scale(255),
      customColor: () => hexToRgb(this.states[index]?.color),
    });
    return color;
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

  _updateSceneWithData(data) {
    this.scene.clear();
    this._addCube2Scene();
    this._addPointCloudData2Scene(data);
    this._addClusters2Scene();
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
    this.camera.param = this.camera.param.add(Vec3(deltaY * 0.001, 0, 0));
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
    return this.kmeans.clusters[index].scale(255).toArray();
  }

  /**
   *
   * @param {ArrayBuffer<Number>} imageData: Array<Number> width, height, color
   */
  updateWithImageData(imageData, filter) {
    const data = getDataFromImagePixels(imageData, filter);
    this.kmeans.update(data);
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
