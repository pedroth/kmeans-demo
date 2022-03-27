//========================================================================================
/*                                                                                      *
 *                                       APP VARS                                       *
 *                                                                                      */
//========================================================================================

import Canvas from "./src/Canvas.js";
import { createVideo, powInt } from "./src/Utils.js";

let isVideo = true;
const canvas = new Canvas(document.getElementById("canvas"));
const canvasVideo = new Canvas(document.getElementById("canvasVideo"));
const imageLoader = document.getElementById("imageLoader");
let auxImage;

const video = document.getElementById("video");
let numberOfCluster = 2;

let clusters = [];
let phi = [];
let sigmas = [];

const numOfStates = 4;
const clustersState = [];

let numOfSamples = Math.floor(
  canvas.width *
    canvas.height *
    Number.parseFloat(document.getElementById("alphaValue").innerText)
);

let averageColor = [0, 0, 0];
let isLearning = true;
let memoryData = [];
let maxDataFrames = 1;
let memoryIndex = 0;

//========================================================================================
/*                                                                                      *
 *                                          UI                                          *
 *                                                                                      */
//========================================================================================

function resize() {
  if (window.innerWidth >= window.innerHeight) {
    document.getElementById("canvasSpace").style.flexDirection = "row";
  } else {
    document.getElementById("canvasSpace").style.flexDirection = "column";
  }
}

function initUI() {
  [
    { id2append: "inputNClusters", item: createNumberOfClustersUI() },
    { id2append: "trainingPercentage", item: createTrainingDataUI() },
    { id2append: "startReset", item: createLearningButtonUI() },
    { id2append: "startReset", item: createResetButtonUI() },
  ].forEach(({ id2append, item }) => {
    document.getElementById(id2append).appendChild(item);
  });
}

function createNumberOfClustersUI() {
  const input = document.createElement("input");
  input.setAttribute("type", "number");
  input.setAttribute("min", "2");
  input.setAttribute("value", numberOfCluster);
  input.onchange = (e) => {
    numberOfCluster = e.target.value;
    initClusters();
    updateTable();
  };
  return input;
}

function createTrainingDataUI() {
  const input = document.createElement("input");
  input.setAttribute("type", "range");
  input.setAttribute("min", "1");
  input.setAttribute("max", "100");
  input.setAttribute("step", "1");
  input.setAttribute("value", "50");
  input.onchange = (e) => {
    let alpha = parseInt(e.target.value);
    alpha = alpha / 100.0;
    numOfSamples = Math.floor(canvas.width * canvas.height * alpha);
    document.getElementById("alphaValue").innerHTML = "" + alpha;
  };
  return input;
}

function createLearningButtonUI() {
  const STOP_LEARNING = "Stop Learning";
  const START_LEARNING = "Start Learning";
  const input = document.createElement("input");
  input.setAttribute("type", "button");
  input.setAttribute("value", STOP_LEARNING);
  input.onclick = () => {
    isLearning = !isLearning;
    if (isLearning) {
      input.value = STOP_LEARNING;
    } else {
      input.value = START_LEARNING;
    }
  };
  return input;
}

function createResetButtonUI() {
  const input = document.createElement("input");
  input.setAttribute("type", "button");
  input.setAttribute("value", "reset");
  input.onclick = initClusters;
  return input;
}

function buildRow(name, rgb, clusterId) {
  rgb[0] = Math.floor(rgb[0]);
  rgb[1] = Math.floor(rgb[1]);
  rgb[2] = Math.floor(rgb[2]);

  let row = document.createElement("tr");

  let nameCol = document.createElement("td");
  nameCol.innerHTML = name;
  row.appendChild(nameCol);

  let colorCol = document.createElement("td");
  colorCol.innerHTML = rgb;
  colorCol.style.background =
    "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
  colorCol.style.color = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
  colorCol.id = "cluster" + clusterId;
  row.appendChild(colorCol);

  let layerCol = document.createElement("td");
  let auxButton = document.createElement("input");
  auxButton.setAttribute("type", "button");
  layerCol.appendChild(auxButton);
  auxButton.value = clusterId == -1 ? "" : clustersState[clusterId];
  auxButton.numId = clusterId;
  auxButton.onclick = function () {
    if (this.numId == -1) {
      //do nothing
    } else {
      clustersState[this.numId] = (clustersState[this.numId] + 1) % numOfStates;
      this.value = "" + clustersState[this.numId];
    }
  };
  row.appendChild(layerCol);

  return row;
}

function buildRowSoft(name, rgb) {
  rgb[0] = Math.floor(rgb[0]);
  rgb[1] = Math.floor(rgb[1]);
  rgb[2] = Math.floor(rgb[2]);
  document.getElementById(
    name
  ).style.background = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  document.getElementById(
    name
  ).style.color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function updateTableSoft() {
  buildRowSoft("cluster-1", averageColor);
  for (let i = 0; i < clusters.length; i++) {
    buildRowSoft("cluster" + i, clusters[i]);
  }
}

function updateTable() {
  let table = document.getElementById("clusterTable");
  let n = table.childNodes.length;
  for (let i = 0; i < n; i++) {
    table.removeChild(table.childNodes[0]);
  }
  table.appendChild(buildRow("Average", averageColor, -1));
  for (let i = 0; i < clusters.length; i++) {
    table.appendChild(buildRow("Cluster " + i, clusters[i], i));
  }
}

//========================================================================================
/*                                                                                      *
 *                                      3D VECTORS                                      *
 *                                                                                      */
//========================================================================================

function vec3(x, y, z) {
  let ans = [];
  ans[0] = x;
  ans[1] = y;
  ans[2] = z;
  return ans;
}

let add = function (u, v) {
  let ans = [];
  ans[0] = u[0] + v[0];
  ans[1] = u[1] + v[1];
  ans[2] = u[2] + v[2];
  return ans;
};

let diff = function (u, v) {
  let ans = [];
  ans[0] = u[0] - v[0];
  ans[1] = u[1] - v[1];
  ans[2] = u[2] - v[2];
  return ans;
};

let scalarMult = function (s, v) {
  let ans = [];
  ans[0] = s * v[0];
  ans[1] = s * v[1];
  ans[2] = s * v[2];
  return ans;
};

let squaredNorm = function (v) {
  return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
};

let myNorm = function (v) {
  return Math.sqrt(squaredNorm(v));
};

//========================================================================================
/*                                                                                      *
 *                                         UTILS                                        *
 *                                                                                      */
//========================================================================================

function getImageIndex(x, size) {
  return 4 * (size[0] * x[0] + x[1]);
}

/*
 * x is a vector
 * size is a vector where x-coord is width and y-coord is height
 */
function getPxlData(x, data, size) {
  let rgba = [];
  let index = getImageIndex(x, size);
  rgba[0] = data[index];
  rgba[1] = data[index + 1];
  rgba[2] = data[index + 2];
  rgba[3] = data[index + 3];
  return rgba;
}

function handleImage(e) {
  const reader = new FileReader();
  reader.onload = function (event) {
    auxImage = new Image();
    auxImage.width = canvas.width;
    auxImage.height = canvas.height;
    auxImage.onload = function () {
      isVideo = false;
      canvas.fill();
      canvasVideo.fill();
    };
    auxImage.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
}

function samplingData(data, numOfSamples) {
  let size = [data.width, data.height];
  for (let i = 0; i < numOfSamples; i++) {
    let x = [
      Math.floor(Math.random() * size[1]),
      Math.floor(Math.random() * size[0]),
    ];
    let rgba = getPxlData(x, data.data, size);
    memoryData[memoryIndex++] = vec3(rgba[0], rgba[1], rgba[2]);
    memoryIndex = memoryIndex % (numOfSamples * maxDataFrames);
  }
  return memoryData;
}

//========================================================================================
/*                                                                                      *
 *                                        KMEANS                                        *
 *                                                                                      */
//========================================================================================

function classifyData(x) {
  let kIndex = -1;
  let minDistance = Number.MAX_VALUE;
  for (let i = 0; i < numberOfCluster; i++) {
    let dist = myNorm(diff(x, clusters[i]));
    if (minDistance > dist) {
      minDistance = dist;
      kIndex = i;
    }
  }
  return kIndex;
}

function classifyIntoClusters(sampleData, classifyFunction) {
  let clusterIndex = [];
  for (let i = 0; i < numberOfCluster; i++) {
    clusterIndex[i] = [];
  }
  for (let i = 0; i < sampleData.length; i++) {
    let kIndex = classifyFunction(sampleData[i]);
    let j = clusterIndex[kIndex].length;
    clusterIndex[kIndex][j] = i;
  }
  return clusterIndex;
}

function computeAverageColor(sampleData) {
  let average = vec3(0, 0, 0);
  for (let i = 0; i < sampleData.length; i++) {
    let rgb = sampleData[i];
    average = add(average, rgb);
  }
  average = scalarMult(1 / sampleData.length, average);
  return average;
}

function updateClusters(dataClusterIndex, sampleData) {
  for (let i = 0; i < numberOfCluster; i++) {
    const clusterDataIndex = dataClusterIndex[i];
    let n = clusterDataIndex.length;
    let mu = vec3(0, 0, 0);
    for (let j = 0; j < n; j++) {
      let rgb = sampleData[clusterDataIndex[j]];
      mu = add(mu, rgb);
    }
    clusters[i] =
      n == 0
        ? vec3(255 * Math.random(), 255 * Math.random(), 255 * Math.random())
        : scalarMult(1.0 / n, mu);
  }
}

function drawClusters(image, classifyFunction, stateMachine) {
  let data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    let rgb = vec3(data[i], data[i + 1], data[i + 2]);
    let index = classifyFunction(rgb);
    let newColor = stateMachine(rgb, index);
    data[i] = newColor[0];
    data[i + 1] = newColor[1];
    data[i + 2] = newColor[2];
    data[i + 3] = 255;
  }
}

function runKmeans(
  data,
  classifyFunction,
  clusterUpdateFunction,
  drawFunction,
  stateMachine
) {
  if (isLearning) {
    let sampleData = samplingData(data, numOfSamples);
    let dataIntoClusters = classifyIntoClusters(sampleData, classifyFunction);
    averageColor = computeAverageColor(sampleData);
    clusterUpdateFunction(dataIntoClusters, sampleData);
  }
  drawFunction(data, classifyFunction, stateMachine);
}

//========================================================================================
/*                                                                                      *
 *                                          GMM                                         *
 *                                                                                      */
//========================================================================================

function gaussian(x, mu, sigma) {
  let dist = myNorm(diff(x, mu));
  return (
    (1.0 / Math.sqrt(powInt(2 * Math.PI * sigma, 3))) *
    Math.exp(-((dist * dist) / (2 * sigma * sigma)))
  );
}

function classifyDataGMM(x) {
  let w = [];
  let acc = 0;
  for (let i = 0; i < clusters.length; i++) {
    w[i] = gaussian(x, clusters[i], sigmas[i]) * phi[i];
    acc += w[i];
  }
  for (let i = 0; i < clusters.length; i++) {
    w[i] = w[i] / acc;
  }
  return w;
}

function updateClustersGMM(weights, sampleData) {
  for (let i = 0; i < numberOfCluster; i++) {
    const w = weights[i];
    let n = w.length;
    let mu = vec3(0, 0, 0);
    let acc = 0;
    for (let j = 0; j < n; j++) {
      let rgb = sampleData[j];
      mu = add(mu, scalarMult(w[j], rgb));
      acc += w[j];
    }
    clusters[i] = scalarMult(1 / acc, mu);
    let sigma = 0;
    for (let j = 0; j < n; j++) {
      let rgb = sampleData[j];
      sigma += w[j] * squaredNorm(diff(rgb, clusters[i]));
    }
    sigmas[i] = Math.sqrt((2 / (3 * acc)) * sigma);
    phi[i] = (1 / n) * acc;
  }
}

function drawClustersGMM(image, classifyFunction, stateMachine) {
  let data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    let rgb = vec3(data[i], data[i + 1], data[i + 2]);
    let w = classifyFunction(rgb);
    let newColor = vec3(0, 0, 0);
    for (let j = 0; j < numberOfCluster; j++) {
      newColor = add(newColor, scalarMult(w[j], stateMachine(rgb, j)));
    }
    data[i] = newColor[0];
    data[i + 1] = newColor[1];
    data[i + 2] = newColor[2];
    data[i + 3] = 255;
  }
}

function classifyIntoClustersGMM(sampleData, classifyFunction) {
  let clusterIndex = [];
  for (let i = 0; i < numberOfCluster; i++) {
    clusterIndex[i] = [];
  }
  for (let i = 0; i < sampleData.length / 10; i++) {
    let weights = classifyFunction(sampleData[i]);
    for (let j = 0; j < weights.length; j++) {
      clusterIndex[j][i] = weights[j];
    }
  }
  return clusterIndex;
}

function runGMM(
  data,
  classifyFunction,
  clusterUpdateFunction,
  drawFunction,
  stateMachine
) {
  if (isLearning) {
    let sampleData = samplingData(data, numOfSamples);
    let weights = classifyIntoClustersGMM(sampleData, classifyFunction);
    averageColor = computeAverageColor(sampleData);
    clusterUpdateFunction(weights, sampleData);
  }
  drawFunction(data, classifyFunction, stateMachine);
}

//========================================================================================
/*                                                                                      *
 *                                         MAIN                                         *
 *                                                                                      */
//========================================================================================

function initClusters() {
  clusters = [];
  for (let i = 0; i < numberOfCluster; i++) {
    clusters[i] = vec3(
      255 * Math.random(),
      255 * Math.random(),
      255 * Math.random()
    );
    clustersState[i] = 1;
    sigmas[i] = 255 * Math.random();
    phi[i] = 1.0 / numberOfCluster;
  }
}

function init() {
  initUI();
  window.addEventListener("resize", resize);
  resize();
  createVideo(video);
  initClusters();
  updateTable();
  imageLoader.addEventListener("change", handleImage, false);
}

function outputFromState(rgb, clusterIndex) {
  const state = clustersState[clusterIndex];
  const state2color = {
    0: rgb,
    1: clusters[clusterIndex],
    2: [0, 0, 0],
    3: [255, 255, 255],
  };
  if (state in state2color) {
    return state2color[state];
  }
  return rgb;
}

function getInput() {
  if (isVideo) {
    return video;
  }
  return auxImage;
}

function draw() {
  const input = getInput();
  canvasVideo.paintImage(input);
  const videoImage = canvasVideo.image;

  const yourSelect = document.getElementById("selectAlgorithm");
  const selectedAlgorithm = yourSelect.options[yourSelect.selectedIndex].value;
  const algorithm2Action = {
    Kmeans: () =>
      runKmeans(
        videoImage,
        classifyData,
        updateClusters,
        drawClusters,
        outputFromState
      ),
    GMM: () =>
      runGMM(
        videoImage,
        classifyDataGMM,
        updateClustersGMM,
        drawClustersGMM,
        outputFromState
      ),
  };
  if (selectedAlgorithm in algorithm2Action) {
    algorithm2Action[selectedAlgorithm]();
  }
  canvas.image = videoImage;
  canvas.paint();
  updateTableSoft();
  requestAnimationFrame(draw);
}

init();
requestAnimationFrame(draw);
