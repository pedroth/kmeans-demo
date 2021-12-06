/*
 *  Setup
 */
let isVideo = true;
let canvas = document.getElementById('canvas');
let canvasVideo = document.getElementById('canvasVideo');
let ctx = canvas.getContext('2d');
let ctxVideo = canvasVideo.getContext('2d');
let imageLoader = document.getElementById('imageLoader');
let auxImage;

let down = false;

let startTime;

let width, height;

let mouse;

//video lets
let video = document.getElementById("video");
let numberOfCluster = document.getElementById('numOfClusters').value;

let clusters = [];
let phi = [];
let sigmas = [];

let numOfStates = 4;
let clustersState = [];

let numOfSamples = Math.floor(canvas.width * canvas.height * (parseInt(document.getElementById('alpha').value) / 100.0));

let averageColor = [0, 0, 0];

let time = 0;

let isLearning = true;

let memoryData = [];
let maxDataFrames = 1;
let memoryIndex = 0;

/*
 * Utils
 */
function max(v) {
    let maximum = Number.MIN_VALUE;
    let maxIndex = -1;
    for (let i = 0; i < v.length; i++) {
        if (maximum < v[i]) {
            maximum = v[i];
            maxIndex = i;
        }
    }
    return [maximum, maxIndex];
}

function powInt(x, i) {
    if (i === 0) {
        return 1;
    } else if (i === 1) {
        return x;
    } else {
        let q = Math.floor(i / 2);
        let r = i % 2;
        if (r === 0) {
            return powInt(x * x, q);
        } else {
            return x * powInt(x * x, q);
        }
    }
}

function clamp(x, xmin, xmax) {
    return Math.max(xmin, Math.min(x, xmax));
}

function buildRow(name, rgb, clusterId) {
    rgb[0] = Math.floor(rgb[0]);
    rgb[1] = Math.floor(rgb[1]);
    rgb[2] = Math.floor(rgb[2]);

    let row = document.createElement('tr');

    let nameCol = document.createElement('td');
    nameCol.innerHTML = name;
    row.appendChild(nameCol);

    let colorCol = document.createElement('td');
    colorCol.innerHTML = rgb;
    colorCol.style.background = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
    colorCol.style.color = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
    colorCol.id = "cluster" + clusterId;
    row.appendChild(colorCol);

    let layerCol = document.createElement('td');
    let auxButton = document.createElement('input');
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
    document.getElementById(name).style.background = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
    document.getElementById(name).style.color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}

function updateTableSoft() {
    buildRowSoft("cluster-1", averageColor);
    for (let i = 0; i < clusters.length; i++) {
        buildRowSoft("cluster" + i, clusters[i]);
    }
}

function updateTable() {
    let table = document.getElementById('clusterTable');
    let n = table.childNodes.length;
    for (let i = 0; i < n; i++) {
        table.removeChild(table.childNodes[0]);
    }

    table.appendChild(buildRow("average", averageColor, -1));
    for (let i = 0; i < clusters.length; i++) {
        table.appendChild(buildRow("cluster " + i, clusters[i], i));
    }
}

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

function drawPxl(x, data, rgb) {
    let size = [width, height];
    let index = getImageIndex(x, size);
    data[index] = rgb[0];
    data[index + 1] = rgb[1];
    data[index + 2] = rgb[2];
    data[index + 3] = rgb[3];
}

/*
 * 3D vectors
 */
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

let myPNorm = function (v, p) {
    return powInt(v[0], p) + powInt(v[1], p) + powInt(v[2], p);
}

let normalize = function (v) {
    if (v[0] !== 0.0 && v[1] !== 0.0 && v[2] !== 0.0) {
        return scalarMult(1 / myNorm(v), v);
    } else {
        return v;
    }
};

let innerProd = function (u, v) {
    return u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
};
/**
* return product between the matrix formed by (u,v,w) and x;
* */
let matrixProd = function (u, v, w, x) {
    return add(add(scalarMult(x[0], u), scalarMult(x[1], v)), scalarMult(x[2], w));
};


/**
 *  Init
 **/
function initNumOfSamples() {
    let alpha = parseInt(document.getElementById('alpha').value);
    alpha = alpha / 100.0;
    numOfSamples = Math.floor(canvas.width * canvas.height * alpha);
    document.getElementById('alphaValue').innerHTML = "" + alpha;
}

function initClusters() {
    clusters = [];
    for (let i = 0; i < numberOfCluster; i++) {
        clusters[i] = vec3(255 * Math.random(), 255 * Math.random(), 255 * Math.random());
        clustersState[i] = 1;
        sigmas[i] = 255 * Math.random();
        phi[i] = (1.0 / numberOfCluster);
    }
}


function updateNumberOfClusters() {
    numberOfCluster = document.getElementById('numOfClusters').value;
    initClusters();
    updateTable();
}


function handleImage(e) {
    let reader = new FileReader();
    reader.onload = function (event) {
        auxImage = new Image();
        auxImage.width = canvas.width;
        auxImage.height = canvas.height;
        auxImage.onload = function () {
            isVideo = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctxVideo.clearRect(0, 0, canvas.width, canvas.height);
        }
        auxImage.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
}

function init() {
    canvas.addEventListener("mousedown", mouseDown, false);
    canvas.addEventListener("mouseup", mouseUp, false);
    canvas.addEventListener("mousemove", mouseMove, false);
    document.addEventListener("keydown", keyDown, false);

    window.addEventListener("resize", () => {
        if (window.innerWidth >= window.innerHeight) {
            document.getElementById("canvasSpace").style.flexDirection = "row";
        } else {
            document.getElementById("canvasSpace").style.flexDirection = "column";
        }
    });

    startTime = new Date().getTime();

    width = canvas.width;
    height = canvas.height;

    mouse = [0, 0];

    // https://davidwalsh.name/browser-camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
            //video.src = window.URL.createObjectURL(stream);
            video.srcObject = stream;
            video.play();
        });
    }

    initClusters();
    updateTable();

    imageLoader.addEventListener('change', handleImage, false);
}

function keyDown(e) {
    if (e.keyCode == 87) {
    }

    if (e.keyCode == 83) {
    }

    if (e.keyCode == 65) {
    }

    if (e.keyCode == 68) {
    }
}

function mouseDown(e) {
    let rect = canvas.getBoundingClientRect();
    mouse[0] = e.clientY - rect.top;
    mouse[1] = e.clientX - rect.left;
    down = true;
}

function mouseUp() {
    down = false;
}

function mouseMove(e) {
    let rect = canvas.getBoundingClientRect();
    let mx = (e.clientX - rect.left), my = (e.clientY - rect.top);
    if (!down || mx == mouse[0] && my == mouse[1])
        return;
    mouse[0] = my;
    mouse[1] = mx;
};

function samplingData(data, numOfSamples) {
    let size = [data.width, data.height];
    for (let i = 0; i < numOfSamples; i++) {
        let x = [Math.floor(Math.random() * size[1]), Math.floor(Math.random() * size[0])];
        let rgba = getPxlData(x, data.data, size);
        memoryData[memoryIndex++] = vec3(rgba[0], rgba[1], rgba[2]);
        memoryIndex = memoryIndex % (numOfSamples * maxDataFrames);
    }
    return memoryData;
}

// KMeans
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
    let clusterIndex = []
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
        clusterDataIndex = dataClusterIndex[i];
        let n = clusterDataIndex.length;
        let mu = vec3(0, 0, 0);
        for (let j = 0; j < n; j++) {
            let rgb = sampleData[clusterDataIndex[j]];
            mu = add(mu, rgb);
        }
        clusters[i] = n == 0 ? vec3(255 * Math.random(), 255 * Math.random(), 255 * Math.random()) : scalarMult(1.0 / n, mu);
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
    }
}

function runKmeans(data, classifyFunction, clusterUpdateFunction, drawFunction, stateMachine) {
    if (isLearning) {
        let sampleData = samplingData(data, numOfSamples);
        let dataIntoClusters = classifyIntoClusters(sampleData, classifyFunction);
        averageColor = computeAverageColor(sampleData);
        clusterUpdateFunction(dataIntoClusters, sampleData);
    }
    drawFunction(data, classifyFunction, stateMachine);
}
//End Kmeans

//GMM
function gaussian(x, mu, sigma) {
    let dist = myNorm(diff(x, mu));
    return (1.0 / Math.sqrt(powInt(2 * Math.PI * sigma, 3))) * Math.exp(-((dist * dist) / (2 * sigma * sigma)));
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
        w = weights[i];
        let n = w.length;
        let mu = vec3(0, 0, 0);
        let acc = 0;
        for (let j = 0; j < n; j++) {
            let rgb = sampleData[j];
            mu = add(mu, scalarMult(w[j], rgb));
            acc += w[j];
        }
        clusters[i] = scalarMult(1 / acc, mu);
        sigma = 0;
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
    }
}

function classifyIntoClustersGMM(sampleData, classifyFunction) {
    let clusterIndex = []
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

function runGMM(data, classifyFunction, clusterUpdateFunction, drawFunction, stateMachine) {
    if (isLearning) {
        let sampleData = samplingData(data, numOfSamples);
        let weights = classifyIntoClustersGMM(sampleData, classifyFunction);
        averageColor = computeAverageColor(sampleData);
        clusterUpdateFunction(weights, sampleData);
    }
    drawFunction(data, classifyFunction, stateMachine);
}
//End GMM

function stopLearning() {
    isLearning = !isLearning;
    let button = document.getElementById('stopLearningButton');
    if (isLearning) {
        button.value = "Stop Learning";
    } else {
        button.value = "Start Learning";

    }
}

function myStateMachine(rgb, clusterIndex) {
    let state = clustersState[clusterIndex];
    switch (state) {
        case 0:
            return rgb;
        case 1:
            return clusters[clusterIndex];
        case 2:
            return [0, 0, 0];
        case 3:
            return [255, 255, 255];
        default:
            return rgb;
    }
}

function getInput() {
    if (isVideo) {
        return video;
    }
    return auxImage;
}

function draw() {
    let dt = 1E-3 * (new Date().getTime() - startTime);
    startTime = new Date().getTime();
    time += dt;

    let input = getInput();
    ctxVideo.drawImage(input, 0, 0, width, height);

    let videoImage = ctxVideo.getImageData(0, 0, canvasVideo.width, canvasVideo.height);

    let stateMachine = myStateMachine;

    let yourSelect = document.getElementById("selectAlgorithm");
    if (yourSelect.options[yourSelect.selectedIndex].value == "Kmeans") {
        runKmeans(videoImage, classifyData, updateClusters, drawClusters, stateMachine);
    } else {
        runGMM(videoImage, classifyDataGMM, updateClustersGMM, drawClustersGMM, stateMachine);
    }
    ctx.putImageData(videoImage, 0, 0);

    updateTableSoft();

    requestAnimationFrame(draw);
}
/**
*  Main
**/
init()
requestAnimationFrame(draw);