export default class Scene {
  constructor() {
    this.scene = {};
  }

  addElement(elem) {
    const classes = [Line, Path];
    if (!classes.some((c) => elem instanceof c)) return this;
    const { name } = elem;
    this.scene[name] = elem;
    return this;
  }

  clear() {
    this.scene = {};
  }

  getElements() {
    return Object.values(this.scene);
  }
}

class Line {
  /**
   *
   * @param {String} name
   * @param {Vec3} start
   * @param {Vec3} end
   * @param {Array4} color
   */
  constructor(name, start, end, color) {
    this.name = name;
    this.start = start;
    this.end = end;
    this.color = color;
  }

  static builder() {
    return new LineBuilder();
  }
}

class LineBuilder {
  constructor() {
    this._name;
    this._start;
    this._end;
    this._color;
  }

  name(name) {
    this._name = name;
    return this;
  }

  start(start) {
    this._start = start;
    return this;
  }

  end(end) {
    this._end = end;
    return this;
  }

  color(color) {
    this._color = color;
    return this;
  }

  build() {
    const attrs = [this._name, this._start, this._end, this._color];
    if (attrs.some((x) => x === undefined)) {
      throw new Error("Line is incomplete");
    }
    return new Line(...attrs);
  }
}

Scene.Line = Line;

class Point {
  /**
   *
   * @param {String} name
   * @param {Number} radius
   * @param {Array4} color
   */
  constructor(name, radius, color) {
    this.name = name;
    this.radius = radius;
    this.color = color;
  }

  static builder() {
    return new PointBuilder();
  }
}

class PointBuilder {
  constructor() {
    this._name;
    this._radius;
    this._color;
  }

  name(name) {
    this._name = name;
    return this;
  }

  radius(radius) {
    this._radius = radius;
    return this;
  }

  color(color) {
    this._color = color;
    return this;
  }

  build() {
    const attrs = [this._name, this._radius, this._color];
    if (attrs.some((x) => x === undefined)) {
      throw new Error("Point is incomplete");
    }
    return new Point(...attrs);
  }
}

Scene.Path = Path;
