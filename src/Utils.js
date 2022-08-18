import { Vec3 } from "./Vec.js";

export function createWebCamFromVideo(domVideo) {
  // https://davidwalsh.name/browser-camera
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        //video.src = window.URL.createObjectURL(stream);
        domVideo.srcObject = stream;
        domVideo.play();
      });
  }
  return domVideo;
}

export function max(v) {
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

export function powInt(x, i) {
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

export function clamp(x, xmin, xmax) {
  return Math.max(xmin, Math.min(x, xmax));
}

/**
 *
 * @param {Array3<Vec3>} matrix
 * @param {Vec3} vec3
 * @returns {Vec3}
 */
export function matrixTransposeProd(matrix, vec3) {
  return Vec3(...matrix.map((e) => e.dot(vec3)));
}

/**
 *
 * @param {Array3<Vec3>} matrix
 * @param {Vec3} vec3
 * @returns {Vec3}
 */
export function matrixProd(matrix, vec3) {
  const [x, y, z] = vec3.toArray();
  return matrix[0].scale(x).add(matrix[1].scale(y)).add(matrix[2].scale(z));
}

export function measureTime(lambda, { label = "" }) {
  const startTime = performance.now();
  lambda();
  const endTime = performance.now();
  console.log(`Performance ${endTime - startTime}s ${label}`);
}
