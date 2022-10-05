//========================================================================================
/*                                                                                      *
 *                                       APP VARS                                       *
 *                                                                                      */
//========================================================================================

import Canvas from "./src/Canvas.js";
import GUI from "./src/GUI.js";
import ColorGMM from "./src/shaders/ColorGMM.js";
import ColorKmeans from "./src/shaders/ColorKmeans.js";
import PointCloud from "./src/shaders/PointCloud.js";
import PointCloudGMM from "./src/shaders/PointCloudGMM.js";
import PointCloudKmeans from "./src/shaders/PointCloudKmeans.js";
import PxlGridGMM from "./src/shaders/PxlGridGMM.js";
import PxlGridKmeans from "./src/shaders/PxlGridKmeans.js";
import { CANVAS_SIZE, createWebCamFromVideo } from "./src/Utils.js";

function createAppState() {
  const appState = {
    imageFile: undefined,
    algorithmSelect: SHADERS.kmeans,
    numberOfClusters: 2,
    samplePercentage: 0.75,
    isLearning: true,
    gridSize: 3,
  };
  appState.algorithmSelect.instance = appState.algorithmSelect.build(
    appState.numberOfClusters
  );
  return appState;
}

function resetAppState(appState) {
  // Hack to maintain camera in point cloud shaders
  if (appState.algorithmSelect?.instance?.camera) {
    const camera = appState.algorithmSelect.instance.camera;
    appState.algorithmSelect.instance = appState.algorithmSelect.build(
      appState.numberOfClusters,
      camera
    );
  } else {
    // normal reset
    appState.algorithmSelect.instance = appState.algorithmSelect.build(
      appState.numberOfClusters,
      appState.gridSize
    );
  }
}

const SHADERS = {
  kmeans: { name: "kmeans", build: (k) => new ColorKmeans(k) },
  gmm: { name: "gmm", build: (k) => new ColorGMM(k) },
  "kmeans grid": {
    name: "kmeans grid",
    build: (k, size) => new PxlGridKmeans(k, size),
  },
  "gmm grid": {
    name: "gmm grid",
    build: (k, size) => new PxlGridGMM(k, size),
  },
  "point cloud": {
    name: "point cloud",
    build: (_, camera) => new PointCloud(camera),
  },
  "point cloud + kmeans": {
    name: "point cloud + kmeans",
    build: (k, camera) => new PointCloudKmeans(k, camera),
  },
  "point cloud + gmm": {
    name: "point cloud + gmm",
    build: (k, camera) => new PointCloudGMM(k, camera),
  },
};

//========================================================================================
/*                                                                                      *
 *                                         UTILS                                        *
 *                                                                                      */
//========================================================================================

function _updateAlgorithm(appState, newState) {
  // Hack to maintain camera in point cloud shaders
  if (appState.algorithmSelect.name.includes("point")) {
    const camera = appState.algorithmSelect.instance?.camera;
    appState.algorithmSelect.instance = appState.algorithmSelect.build(
      newState.numberOfClusters,
      camera
    );
  } else {
    appState.algorithmSelect.instance = appState.algorithmSelect.build(
      newState.numberOfClusters,
      newState.gridSize
    );
  }
}

//========================================================================================
/*                                                                                      *
 *                                          UI                                          *
 *                                                                                      */
//========================================================================================

function createAppTitle() {
  const h1 = document.createElement("h1");
  h1.innerText = "Clustering video colors";
  return h1;
}

function createVideoUI() {
  const videoDOM = document.createElement("video");
  videoDOM.setAttribute("width", 0);
  videoDOM.setAttribute("height", 0);
  videoDOM.setAttribute("autoplay", true);
  return createWebCamFromVideo(videoDOM);
}

function createCanvas({ width, height }) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);
  canvas.setAttribute("class", "canvas");
  return canvas;
}

function createCanvasSpace() {
  const canvasSpace = { dom: document.createElement("div") };
  canvasSpace.dom.setAttribute("class", "canvasSpace");
  const canvasInput = createCanvas(CANVAS_SIZE);
  const canvasOutput = createCanvas(CANVAS_SIZE);
  canvasSpace.dom.appendChild(canvasInput);
  canvasSpace.dom.appendChild(canvasOutput);

  canvasSpace.canvasInput = canvasInput;
  canvasSpace.canvasOutput = canvasOutput;
  return canvasSpace;
}

function createInputSpace(appState) {
  const gui = GUI.builder()
    .add(
      GUI.file("imageFile")
        .value(appState.imageFile)
        .label("Image File")
        .extensions("jpeg", "jpg", "png")
        .onload((e) => {
          return new Promise((resolve) => {
            const auxImage = new Image();
            auxImage.onload = () => {
              resolve(auxImage);
            };
            auxImage.src = e.target.result;
          });
        }),
      GUI.selector("algorithmSelect")
        .value(appState.algorithmSelect)
        .label("Clustering method")
        .options(
          Object.keys(SHADERS).map((option) => ({
            label: option,
            value: option,
          }))
        ),
      GUI.number("numberOfClusters")
        .value(appState.numberOfClusters)
        .label("Number of clusters")
        .min(1),
      GUI.range("samplePercentage")
        .value(appState.samplePercentage)
        .label("Training data percentage")
        .min(0)
        .max(1)
        .step(0.01),
      GUI.range("gridSize")
        .value(appState.gridSize)
        .label("Grid size")
        .min(1)
        .max(50)
        .step(1),
      GUI.object("learning")
        .label("Learning")
        .children(
          GUI.boolean("isLearning")
            .value(appState.isLearning)
            .label("Is Learning"),
          GUI.button("resetButton")
            .label("Reset")
            .onClick(() => resetAppState(appState))
        )
    )
    .onChange((newState, oldState) => {
      Object.keys(newState).forEach((key) => {
        if (key === "learning") {
          appState.isLearning = newState.learning.isLearning;
          return;
        }
        if (key === "algorithmSelect") {
          if (newState.algorithmSelect !== oldState.algorithmSelect) {
            appState.algorithmSelect = SHADERS[newState.algorithmSelect];
            _updateAlgorithm(appState, newState)
          }
          return;
        }
        if (key in appState) {
          appState[key] = newState[key];
        }
      });
      if (oldState.numberOfClusters !== newState.numberOfClusters) {
        _updateAlgorithm(appState, newState)
        return
      }
      if (oldState.gridSize !== newState.gridSize) {
        _updateAlgorithm(appState, newState);
        return;
      }
    })
    .build();
  return { gui, dom: gui.getDOM() };
}

function createOutputSpace() {
  return document.createElement("div");
}

function onResize(UI) {
  const canvasSpace = UI.canvasSpace.dom;
  if (window.innerWidth >= window.innerHeight) {
    canvasSpace.style.flexDirection = "row";
  } else {
    canvasSpace.style.flexDirection = "column";
  }
}

function createUI(appState, domSpace) {
  const UI = {};
  UI.video = createVideoUI();
  UI.canvasSpace = createCanvasSpace();
  const { gui, dom } = createInputSpace(appState);
  UI.gui = gui;
  UI.input = dom;
  UI.output = createOutputSpace();
  domSpace.appendChild(createAppTitle());
  domSpace.appendChild(UI.video);
  domSpace.appendChild(UI.canvasSpace.dom);
  domSpace.appendChild(UI.input);
  domSpace.appendChild(UI.output);
  window.addEventListener("resize", () => onResize(UI));
  onResize(UI);
  return UI;
}

function createToolWithLink({ url, title, text }) {
  const icon = document.createElement("i");
  icon.setAttribute("class", "material-icons");
  const link = document.createElement("a");
  link.setAttribute("title", title);
  link.setAttribute("href", url);
  link.setAttribute("target", "_blank");
  link.setAttribute("rel", "noopener");
  link.innerText = text;
  icon.appendChild(link);
  return icon;
}

function createToolBar() {
  const tools = document.createElement("div");
  tools.setAttribute("class", "tools");
  const codeIcon = createToolWithLink({
    url: "https://github.com/pedroth/kmeans-demo",
    title: "Github",
    text: "code",
  });
  tools.appendChild(codeIcon);
  document.body.appendChild(tools);
}

function getCanvasInput(UI) {
  const canvasInput = UI.canvasSpace.canvasInput;
  return new Canvas(canvasInput);
}

function getCanvasOutput(UI) {
  const canvasInput = UI.canvasSpace.canvasOutput;
  return new Canvas(canvasInput);
}

//========================================================================================
/*                                                                                      *
 *                                         MAIN                                         *
 *                                                                                      */
//========================================================================================

function isLearning({ isLearning }) {
  return isLearning;
}

function getAlgorithm(appState) {
  const { algorithmSelect } = appState;
  return algorithmSelect.instance;
}

function getInputImage(UI, { imageFile }) {
  if (!!imageFile) {
    return imageFile;
  }
  return UI.video;
}

function clusterVideoImage(UI, appState) {
  const canvasIn = getCanvasInput(UI);
  const canvasOut = getCanvasOutput(UI);
  const inputImage = getInputImage(UI, appState);
  canvasIn.paintMedia(inputImage);
  canvasOut.paintMedia(inputImage);
  const imageData = canvasIn.getData();
  const clusterAlgorithm = getAlgorithm(appState);
  if (isLearning(appState)) {
    clusterAlgorithm.updateWithImageData(
      imageData,
      () => Math.random() < appState.samplePercentage
    );
  }
  clusterAlgorithm.paintImage({ imageData, canvasOut, appState });
  clusterAlgorithm.updateOutput(UI.output);
  requestAnimationFrame(() => clusterVideoImage(UI, appState));
}

(() => {
  createToolBar();
  const appState = createAppState();
  const UI = createUI(appState, document.getElementById("app"));
  requestAnimationFrame(() => clusterVideoImage(UI, appState));
})();
