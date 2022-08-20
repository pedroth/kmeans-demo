//========================================================================================
/*                                                                                      *
 *                                       APP VARS                                       *
 *                                                                                      */
//========================================================================================

import Canvas from "./src/Canvas.js";
import GUI from "./src/GUI.js";
import ColorGMM from "./src/shaders/ColorGMM.js";
import ColorKmeans from "./src/shaders/ColorKmeans.js";
import { createWebCamFromVideo } from "./src/Utils.js";

function createAppState() {
  const appState = {
    imageFile: undefined,
    algorithmSelect: SHADERS.kmeans,
    numberOfClusters: 2,
    samplePercentage: 0.7,
    isLearning: true,
    clustersState: [],
  };
  appState.algorithmSelect.instance = appState.algorithmSelect.build(
    appState.numberOfClusters
  );
  return appState;
}

function resetAppState(appState) {
  appState.algorithmSelect.instance = appState.algorithmSelect.build(
    appState.numberOfClusters
  );
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

const SHADERS = {
  kmeans: { name: "kmeans", build: (k) => new ColorKmeans(k) },
  gmm: { name: "gmm", build: (k) => new ColorGMM(k) },
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
      GUI.file("imageFile")
        .value(appState.imageFile)
        .label("Image File")
        .extensions("jpeg", "jpg", "png")
        .onload((e) => {
          console.log("image file event", e);
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
            appState.algorithmSelect.instance = appState.algorithmSelect.build(
              newState.numberOfClusters
            );
          }
          return;
        }
        if (key in appState) {
          appState[key] = newState[key];
        }
      });
      if (oldState.numberOfClusters !== newState.numberOfClusters) {
        appState.algorithmSelect.instance = appState.algorithmSelect.build(
          newState.numberOfClusters
        );
      }
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
  window.addEventListener("resize", () => {
    const canvasSpace = UI.canvasSpace.dom;
    if (window.innerWidth >= window.innerHeight) {
      canvasSpace.style.flexDirection = "row";
    } else {
      canvasSpace.style.flexDirection = "column";
    }
  });
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

function getInputImage(UI) {
  return UI.video;
}

function updateOutput(appState, outputDiv) {}

function clusterVideoImage(UI, appState) {
  const canvasIn = getCanvasInput(UI);
  const canvasOut = getCanvasOutput(UI);
  const inputImage = getInputImage(UI);
  canvasIn.paintMedia(inputImage);
  canvasOut.paintMedia(inputImage);
  const imageData = canvasIn.getData();
  const clusterAlgorithm = getAlgorithm(appState);
  if (isLearning(appState)) {
    clusterAlgorithm.updateWithImageData(imageData);
  }
  clusterAlgorithm.paintImage({ imageData, canvasOut, appState });
  updateOutput(appState, UI.output);
  requestAnimationFrame(() => clusterVideoImage(UI, appState));
}

(() => {
  createToolBar();
  const appState = createAppState();
  const UI = createUI(appState, document.getElementById("app"));
  requestAnimationFrame(() => clusterVideoImage(UI, appState));
})();
