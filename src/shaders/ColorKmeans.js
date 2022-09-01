import Kmeans from "../algorithms/Kmeans.js";
import alertModal from "../modal/modal.js";
import { Vec3 } from "../Vec.js";
import { getDataFromImagePixels } from "./ShaderUtils.js";

const STATES = {
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
};

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb/5624139#5624139
const hexToRgb = (hex) =>
  Vec3(
    ...hex
      .replace(
        /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        (m, r, g, b) => "#" + r + r + g + g + b + b
      )
      .substring(1)
      .match(/.{2}/g)
      .map((x) => parseInt(x, 16))
  );

export default class ColorKmeans {
  constructor(k) {
    this.k = k;
    this.kmeans = new Kmeans(k, 3);
    this.haveGeneratedOutput = false;
    this.states = [...Array(k)].map((_) => ({ type: STATES.CLUSTER }));
  }

  _getClusterColorStateComponent(closeModal, index) {
    const container = document.createElement("div");
    Object.assign(container.style, {
      display: "flex",
      height: "25px",
      margin: "5px",
    });
    container.onclick = () => {
      this.states[index] = { type: STATES.CLUSTER };
      closeModal();
    };
    const title = document.createElement("span");
    Object.assign(title.style, { flex: 1 });
    title.innerText = "Cluster Color:";
    const color = document.createElement("div");
    const clusterColor = this._getColorFromClusterIndex(index);
    Object.assign(color.style, {
      flex: 1,
      background: `rgb(${clusterColor.join(",")})`,
    });
    container.appendChild(title);
    container.appendChild(color);
    return container;
  }

  _getOriginalColorStateComponent(closeModal, index) {
    const container = document.createElement("div");
    Object.assign(container.style, {
      display: "flex",
      height: "25px",
      margin: "5px",
    });
    container.onclick = () => {
      this.states[index] = { type: STATES.ORIGINAL };
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

  _getCustomColorStateComponent(closeModal, index) {
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
      this.states[index] = { type: STATES.CUSTOM, color: evt.target.value };
      closeModal();
    };
    Object.assign(color.style, { flex: 1 });
    container.appendChild(title);
    container.appendChild(color);
    return container;
  }

  _getClusterOnClick(index) {
    return () => {
      // add alert modal with interior and accept/cancel callbacks
      alertModal((closeModal) => {
        const container = document.createElement("div");
        const title = document.createElement("h2");
        title.innerText = `Set cluster ${index} color state:`;
        const innerBody = document.createElement("div");
        innerBody.appendChild(
          this._getClusterColorStateComponent(closeModal, index)
        );
        innerBody.appendChild(
          this._getOriginalColorStateComponent(closeModal, index)
        );
        innerBody.appendChild(
          this._getCustomColorStateComponent(closeModal, index)
        );
        container.appendChild(title);
        container.appendChild(innerBody);
        return container;
      });
    };
  }

  _createOutput(outputElement) {
    outputElement.innerHTML = "";
    Object.assign(outputElement.style, OUTPUT_STYLE);
    for (let i = 0; i < this.k; i++) {
      const clusterColor = this._getColorFromClusterIndex(i);
      const clusterDiv = document.createElement("div");
      Object.assign(clusterDiv.style, CLUSTER_DIV_STYLE);
      clusterDiv.onclick = this._getClusterOnClick(i);
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

  _getColorFromClusterIndex(index) {
    return this.kmeans.clusters[index].scale(255).toArray();
  }

  //========================================================================================
  /*                                                                                      *
   *                                        PUBLIC                                        *
   *                                                                                      */
  //========================================================================================

  /**
   *
   * @param {ArrayBuffer<Number>} imageData: Array<Number> width, height, color
   */
  updateWithImageData(imageData, filter) {
    const data = getDataFromImagePixels(imageData, filter);
    this.kmeans.update(data);
  }

  paintImage({ imageData, canvasOut }) {
    const state2lazyColor = {
      [STATES.CLUSTER]: ({ clusterColor }) => clusterColor(),
      [STATES.ORIGINAL]: ({ originalColor }) => originalColor(),
      [STATES.CUSTOM]: ({ customColor }) => customColor(),
    };
    const dataOut = canvasOut.getData();
    for (let i = 0; i < dataOut.length; i += 4) {
      const rgb = Vec3(
        imageData[i] / 255,
        imageData[i + 1] / 255,
        imageData[i + 2] / 255
      );
      const classification = this.kmeans.predict(rgb);
      const index = classification.findIndex((x) => x > 0);
      const color = state2lazyColor[this.states[index].type]({
        clusterColor: () => this.kmeans.clusters[index].scale(255),
        originalColor: () => rgb.scale(255),
        customColor: () => hexToRgb(this.states[index]?.color),
      });
      dataOut[i] = color.get(0);
      dataOut[i + 1] = color.get(1);
      dataOut[i + 2] = color.get(2);
      dataOut[i + 3] = 255;
    }
    canvasOut.paint();
  }

  updateOutput(outputElement) {
    if (!this.haveGeneratedOutput) {
      this._createOutput(outputElement);
      this.haveGeneratedOutput = true;
      return;
    }
    Array.from(outputElement.children).forEach((outer, i) => {
      const clusterColor = [...this._getColorFromClusterIndex(i)];
      const state = this.states[i];
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
}
