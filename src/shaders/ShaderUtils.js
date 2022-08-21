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
