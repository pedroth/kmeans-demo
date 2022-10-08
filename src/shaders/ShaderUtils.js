import Canvas from "../Canvas.js";
import alertModal from "../modal/modal.js";
import { CANVAS_SIZE } from "../Utils.js";
import { Vec3 } from "../Vec.js";

export const COLOR_DIM = 3;
export const MAX_CANVAS_INDEX = 4 * CANVAS_SIZE.width * CANVAS_SIZE.height - 1;

/**
 *
 * @param {Array<Number>} imageData
 * @returns {Array<Vec3>}
 */
export function getDataFromImagePixels(imageData, filter = () => true) {
  const data = [];
  let j = 0;
  for (let i = 0; i < imageData.length; i += 4) {
    if (filter()) {
      data[j++] = Vec3(
        imageData[i] / 255,
        imageData[i + 1] / 255,
        imageData[i + 2] / 255
      );
    }
  }
  return data;
}

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb/5624139#5624139
export function hexToRgb(hex) {
  return Vec3(
    ...hex
      .replace(
        /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        (m, r, g, b) => "#" + r + r + g + g + b + b
      )
      .substring(1)
      .match(/.{2}/g)
      .map((x) => parseInt(x, 16))
  );
}

//========================================================================================
/*                                                                                      *
 *                                     SHADER OUTPUT                                    *
 *                                                                                      */
//========================================================================================

export const STATES = {
  CLUSTER: 0,
  ORIGINAL: 1,
  CUSTOM: 2,
};

const CLUSTER_DIV_STYLE = {
  display: "flex",
  "flex-direction": "column",
  height: "100%",
  width: "100%",
  "border-style": "solid",
};

const OUTPUT_STYLE = {
  display: "flex",
  height: "75px",
  "padding-top": "10px",
  "padding-bottom": "10px",
};

function _getClusterColorStateComponent({ shader, index, closeModal }) {
  const container = document.createElement("div");
  Object.assign(container.style, {
    display: "flex",
    height: "25px",
    margin: "5px",
  });
  container.onclick = () => {
    shader.states[index] = { type: STATES.CLUSTER };
    closeModal();
  };
  const title = document.createElement("span");
  Object.assign(title.style, { flex: 1 });
  title.innerText = "Cluster Color:";
  const color = document.createElement("div");
  const clusterColor = shader.getRGBArrayFromClusterIndex(index);
  Object.assign(color.style, {
    flex: 1,
    background: `rgb(${clusterColor.join(",")})`,
  });
  container.appendChild(title);
  container.appendChild(color);
  return container;
}

function _getOriginalColorStateComponent({ shader, index, closeModal }) {
  const container = document.createElement("div");
  Object.assign(container.style, {
    display: "flex",
    height: "25px",
    margin: "5px",
  });
  container.onclick = () => {
    shader.states[index] = { type: STATES.ORIGINAL };
    closeModal();
  };
  const title = document.createElement("span");
  Object.assign(title.style, { flex: 1 });
  title.innerText = "Original Color:";
  const color = document.createElement("div");
  Object.assign(color.style, { flex: 1, background: "black" });
  color.innerText = "Original Color";
  container.appendChild(title);
  container.appendChild(color);
  return container;
}

function _getCustomColorStateComponent({ shader, index, closeModal }) {
  const container = document.createElement("div");
  Object.assign(container.style, {
    display: "flex",
    height: "25px",
    margin: "5px",
  });
  const title = document.createElement("span");
  Object.assign(title.style, { flex: 1 });
  title.innerText = "Custom Color:";
  const color = document.createElement("input");
  color.setAttribute("type", "color");
  color.onchange = (evt) => {
    shader.states[index] = { type: STATES.CUSTOM, color: evt.target.value };
    closeModal();
  };
  Object.assign(color.style, { flex: 1 });
  container.appendChild(title);
  container.appendChild(color);
  return container;
}

function _getClusterOnClick(shader, index) {
  return () => {
    // add alert modal with interior and accept/cancel callbacks
    alertModal((closeModal) => {
      const container = document.createElement("div");
      const title = document.createElement("h2");
      title.innerText = `Set cluster ${index} color state:`;
      const innerBody = document.createElement("div");
      innerBody.appendChild(
        _getClusterColorStateComponent({ shader, closeModal, index })
      );
      innerBody.appendChild(
        _getOriginalColorStateComponent({ shader, closeModal, index })
      );
      innerBody.appendChild(
        _getCustomColorStateComponent({ shader, closeModal, index })
      );
      container.appendChild(title);
      container.appendChild(innerBody);
      return container;
    });
  };
}

function _createOutput(shader, outputElement) {
  outputElement.innerHTML = "";
  Object.assign(outputElement.style, OUTPUT_STYLE);
  const k = shader.getNumberOfClusters();
  for (let i = 0; i < k; i++) {
    const clusterColor = shader.getRGBArrayFromClusterIndex(i);
    const clusterDiv = document.createElement("div");
    Object.assign(clusterDiv.style, CLUSTER_DIV_STYLE);
    clusterDiv.onclick = _getClusterOnClick(shader, i);
    const clusterColorDiv = document.createElement("div");
    Object.assign(clusterColorDiv.style, {
      flex: 3,
      background: `rgb(${clusterColor.join(",")}`,
    });
    const stateColorDiv = document.createElement("div");
    Object.assign(stateColorDiv.style, {
      flex: 1,
      background: `rgb(${clusterColor.join(",")}`,
    });
    clusterDiv.appendChild(clusterColorDiv);
    clusterDiv.appendChild(stateColorDiv);
    outputElement.appendChild(clusterDiv);
  }
}

export function updateShaderOutput(shader, outputElement) {
  if (!shader.haveGeneratedOutput) {
    _createOutput(shader, outputElement);
    shader.haveGeneratedOutput = true;
    return;
  }
  Array.from(outputElement.children).forEach((outer, i) => {
    const clusterColor = shader.getRGBArrayFromClusterIndex(i);
    const state = shader.states[i];
    Array.from(outer.children).forEach((inner, j) => {
      // cluster color
      if (j === 0) {
        Object.assign(inner.style, {
          flex: 3,
          height: "100%",
          background: `rgb(${clusterColor.join(",")})`,
        });
        return;
      }
      // state color
      if (j !== 0) {
        inner.innerHTML = "";
        const state2action = {
          [STATES.CLUSTER]: () =>
            (inner.style.background = `rgb(${clusterColor.join(",")})`),
          [STATES.ORIGINAL]: () => {
            inner.style.background = `black`;
            inner.style.color = `white`;
            inner.innerText = "Original Color";
          },
          [STATES.CUSTOM]: () => (inner.style.background = `${state.color}`),
        };
        Object.assign(inner.style, {
          flex: 1,
          height: "100%",
        });
        state2action[state.type]();
      }
    });
  });
}

const GRID_STYLE = (k) => ({
  display: "grid",
  "grid-template-columns": `repeat(min(${k}, 9), 1fr)`,
  "grid-auto-rows": "75px",
  "padding-top": "10px",
  "padding-bottom": "10px",
  gap: "10px",
});

const GRID_ITEM_STYLE = {
  display: "flex",
  height: "100%",
  width: "100%",
  "border-style": "solid",
};

function _createGridOutput(shader, outputElement) {
  outputElement.innerHTML = "";
  const k = shader.getNumberOfClusters();
  Object.assign(outputElement.style, GRID_STYLE(k));
  for (let i = 0; i < k; i++) {
    const clusterGrid = shader.getGridArrayFromClusterIndex(i);
    const clusterDiv = document.createElement("div");
    Object.assign(clusterDiv.style, GRID_ITEM_STYLE);
    const clusterCanvas = document.createElement("canvas");
    clusterCanvas.setAttribute("width", shader.outputCanvasSize);
    clusterCanvas.setAttribute("height", shader.outputCanvasSize);
    Object.assign(clusterCanvas.style, {
      flex: 1,
    });
    const canvas = new Canvas(clusterCanvas);
    _paintOutputCanvasWithColorGrid(shader, clusterGrid, canvas);
    canvas.paint();
    clusterDiv.appendChild(clusterCanvas);
    outputElement.appendChild(clusterDiv);
  }
}

function _paintOutputCanvasWithColorGrid(shader, colorGrid, canvas) {
  const canvasData = canvas.getData();
  const size = canvas.width;
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      const innerIndex = 4 * (dx * size + dy);
      const dxi = Math.floor(shader.gridSize * (dx / size));
      const dyi = Math.floor(shader.gridSize * (dy / size));
      const colorGridIndex = COLOR_DIM * (shader.gridSize * dxi + dyi);
      canvasData[innerIndex] = colorGrid[colorGridIndex];
      canvasData[innerIndex + 1] = colorGrid[colorGridIndex + 1];
      canvasData[innerIndex + 2] = colorGrid[colorGridIndex + 2];
      canvasData[innerIndex + 3] = 255;
    }
  }
}

export function updateGridShaderOutput(shader, outputElement) {
  if (!shader.haveGeneratedOutput) {
    _createGridOutput(shader, outputElement);
    shader.haveGeneratedOutput = true;
    return;
  }
  Array.from(outputElement.children).forEach((outer, i) => {
    const clusterGrid = shader.getGridArrayFromClusterIndex(i);
    Array.from(outer.children).forEach((inner, j) => {
      const canvas = new Canvas(inner);
      _paintOutputCanvasWithColorGrid(shader, clusterGrid, canvas);
      canvas.paint();
    });
  });
}
