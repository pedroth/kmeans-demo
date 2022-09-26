import alertModal from "../modal/modal.js";
import { Vec3 } from "../Vec.js";

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
