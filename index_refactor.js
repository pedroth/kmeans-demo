//========================================================================================
/*                                                                                      *
 *                                       APP VARS                                       *
 *                                                                                      */
//========================================================================================

import Canvas from "./src/Canvas.js";
import { createVideo, powInt } from "./src/Utils.js";

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

function createInputSpace() {
  const input = { dom: document.createElement("div") };
}

function createOutputSpace() {}

function createUI(appState, domSpace) {
  const UI = {};
  UI.video = createVideoUI();
  UI.canvasSpace = createCanvasSpace();
  UI.input = createInputSpace(UI);
  UI.output = createInputSpace(UI);
  domSpace.appendChild(UI.video);
  domSpace.appendChild(UI.canvasSpace);
  domSpace.appendChild(UI.input);
  domSpace.appendChild(UI.output);
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
  const clusterAlgorithm = getAlgorithm(UI);
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

function createAppState() {
  return {
    imageFile: undefined,
    numberOfClusters: 2,
    isLearning: true,
    samplePercentage: 0.7,
    clustersState: [],
  };
}

CLUSTERS_STATE = {
  black: 0,
  clusterColor: 1,
  originalColor: 2,
  white: 3,
};
