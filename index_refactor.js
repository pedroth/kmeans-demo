//========================================================================================
/*                                                                                      *
 *                                       APP VARS                                       *
 *                                                                                      */
//========================================================================================

import Canvas from "./src/Canvas.js";
import GUI from "./src/GUI.js";
import { createVideo, powInt } from "./src/Utils.js";
import Kmeans from "./src/Kmeans.js";
import GMM from "./src/GMM.js";

function createAppState() {
  return {
    imageFile: undefined,
    algorithmSelect: ALGORITHMS.kmeans,
    numberOfClusters: 2,
    samplePercentage: 0.7,
    isLearning: true,
    clustersState: [],
  };
}

function resetAppState(appState) {
  // update app state
}

function updateAppState(appState) {
  // update app state
}

const CLUSTERS_STATE = {
  black: 0,
  clusterColor: 1,
  originalColor: 2,
  white: 3,
};

const ALGORITHMS = {
  kmeans: (k) => new Kmeans(k),
  gmm: (k) => new GMM(k),
};

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
  const video = document.createElement("video");
  video.setAttribute("width", 0);
  video.setAttribute("height", 0);
  video.setAttribute("autoplay", true);
  return video;
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
  const canvasInput = createCanvas({ width: 320, height: 240 });
  const canvasOutput = createCanvas({ width: 320, height: 240 });
  canvasSpace.dom.appendChild(canvasInput);
  canvasSpace.dom.appendChild(canvasOutput);

  canvasSpace.canvasInput = canvasInput;
  canvasSpace.canvasOutput = canvasOutput;
  return canvasSpace;
}

function createInputSpace(appState) {
  const gui = GUI.builder()
    .add(
      // GUI.file("imageFile")
      //   .value(appState.imageFile)
      //   .label("Image File")
      //   .extensions("jpeg", "jpg", "png"),
      // GUI.selector("algorithmSelect")
      //   .value(appState.algorithmSelect)
      //   .label("Clustering method")
      //   .options(ALGORITHMS),
      // GUI.number("numberOfClusters")
      //   .value(appState.numberOfClusters)
      //   .label("Number of clusters")
      //   .min(1),
      // GUI.range("samplePercentage")
      //   .value(appState.samplePercentage)
      //   .label("Training data percentage")
      //   .min(0)
      //   .max(1)
      //   .step(0.01),
      // GUI.object("learning")
      //   .label("Learning")
      //   .children(
      //     GUI.boolean("isLearning")
      //       .value(appState.isLearning)
      //       .label("Is Learning"),
      //     GUI.button("resetButton")
      //       .label("Reset")
      //       .onClick(() => resetAppState(appState))
      //   )
    )
    .onChange((newState) => {
      Object.keys(newState).forEach((key) => {
        if (key === "learning") {
          appState["isLearning"] = newState.learning.isLearning;
          return;
        }
        if (key in appState) {
          appState[key] = newState[key];
        }
      });
    })
    .build();
  return gui.getDOM();
}

function createOutputSpace() {
  return document.createElement("div");
}

function createUI(appState, domSpace) {
  const UI = {};
  UI.video = createVideoUI();
  UI.canvasSpace = createCanvasSpace();
  UI.input = createInputSpace(appState);
  UI.output = createOutputSpace(UI, appState);
  domSpace.appendChild(createAppTitle());
  domSpace.appendChild(UI.video);
  domSpace.appendChild(UI.canvasSpace.dom);
  domSpace.appendChild(UI.input);
  domSpace.appendChild(UI.output);
  return UI;
}

function createToolBar() {
  const tools = document.createElement("div");
  tools.setAttribute("class", "tools");
  const codeIcon = document.createElement("i");
  codeIcon.setAttribute("class", "material-icons");
  const codeLink = document.createElement("a");
  codeLink.setAttribute("title", "Github");
  codeLink.setAttribute("href", "https://github.com/pedroth/kmeans-demo");
  codeLink.setAttribute("target", "_blank");
  codeLink.setAttribute("rel", "noopener");
  codeLink.innerText = "code";
  codeIcon.appendChild(codeLink);
  tools.appendChild(codeIcon);
  document.body.appendChild(tools);
}

//========================================================================================
/*                                                                                      *
 *                                         MAIN                                         *
 *                                                                                      */
//========================================================================================

function isLearning(UI) {}

function getAlgorithm(UI) {}

function paintData(data, dataClassification, canvas) {}

function clusterVideoColors(UI, appState) {
  const canvasIn = getCanvasInput(UI);
  const inputImage = getInputImage();
  canvasIn.paintImage(inputImage);
  const data = canvasIn.getData();
  const clusterAlgorithm = getAlgorithm(appState);
  if (isLearning(UI)) {
    clusterAlgorithm.update(data);
  }
  const dataClassification = clusterAlgorithm.predict(data);
  paintData(data, dataClassification, canvasOut);
  updateOutputTable(clusterAlgorithm, outputTable);
  requestAnimationFrame(() => clusterVideoColors(UI, appState));
}

(() => {
  createToolBar();
  const appState = createAppState();
  const UI = createUI(appState, document.getElementById("app"));
  // requestAnimationFrame(() => clusterVideoColors(UI, appState));
})();
