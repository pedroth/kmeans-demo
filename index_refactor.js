//========================================================================================
/*                                                                                      *
 *                                       APP VARS                                       *
 *                                                                                      */
//========================================================================================

import Canvas from "./src/Canvas.js";
import GUI from "./src/GUI.js";
import { createVideo, powInt } from "./src/Utils.js";
import Kmeans from "./src/Kmeans.js";

function createAppState() {
  return {
    imageFile: undefined,
    algorithm: new Kmeans(2),
    numberOfClusters: 2,
    isLearning: true,
    samplePercentage: 0.7,
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
  const canvasInput = createCanvas({ width: 320, height: 240 });
  const canvasOutput = createCanvas({ width: 320, height: 240 });
  canvasSpace.dom.appendChild(canvasInput);
  canvasSpace.dom.appendChild(canvasOutput);

  canvasSpace.canvasInput = canvasInput;
  canvasSpace.canvasOutput = canvasOutput;
  return canvasSpace;
}

function createInputSpace(appState) {
  const gui = GUI.fromForm([
    GUI.file({
      id: "imageFile",
      label: "Image File",
      extensions: ["jpeg", "jpg", "png"],
    }),
    GUI.selector({
      id: "algorithmSelect",
      label: "Clustering method",
      options: ["K-means", "GMM"],
      value: "K-means",
    }),
    GUI.number({ id: "numberOfClusters", label: "Number of clusters", min: 0 }),
    GUI.range({
      id: "trainingPercentage",
      label: "Training data percentage",
      min: 0,
      step: 0.01,
      max: 1,
      withInput: true,
    }),
    GUI.object({
      children: [
        GUI.toggle({ label: "Is Learning", value: true }),
        GUI.button({ label: "Reset", onClick: () => resetAppState(appState) }),
      ],
      layout: "row",
    }),
  ]);
  gui.onChange((newState) => {
    // update appState
  });
  return gui;
}

function createOutputSpace() {}

function createUI(appState, domSpace) {
  const UI = {};
  UI.video = createVideoUI();
  UI.canvasSpace = createCanvasSpace();
  UI.input = createInputSpace(appState);
  // UI.output = createOutputSpace(UI, appState);
  domSpace.appendChild(createAppTitle());
  domSpace.appendChild(UI.video);
  domSpace.appendChild(UI.canvasSpace);
  domSpace.appendChild(UI.input);
  // domSpace.appendChild(UI.output);
  return UI;
}

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
  const appState = createAppState();
  const UI = createUI(appState, document.getElementById("app"));
  requestAnimationFrame(() => clusterVideoColors(UI, appState));
})();
