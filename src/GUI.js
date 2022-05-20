class GUI {
  constructor(schema, onChangeLambda) {
    this.state = this.buildStateFromSchema(schema);
    this.id2key = this.buildId2KeyMapFromState(this.state);
    this.DOM = this.buildDOMFromSchema(schema);
  }

  getDOM() {
    return this.DOM;
  }

  setValueWithKey(key, value) {
    try {
      const keys = this.id2key[key];
      const lastIndex = keys.length - 1;
      let obj = undefined;
      for (let i = 0; i < lastIndex; i++) {
        obj = this.state[keys[i]];
      }
      obj[lastIndex] = value;
    } catch (error) {
      // do nothing
    }
    return this;
  }

  getValueWithKey(key) {
    try {
      const keys = this.id2key[key];
      let value = undefined;
      for (let i = 0; i < keys.length; i++) {
        value = this.state[keys[i]];
      }
      return value;
    } catch (error) {
      return undefined;
    }
  }

  buildId2KeyMapFromState(state, parents = [], map = {}) {
    Object.keys(state).forEach((key) => {
      const value = state[key];
      if (typeof value === "object") {
        this.buildId2KeyMapFromState(value, parents.concat([key]), map);
      } else {
        map[key] = [...parents, key];
      }
    });
    return map;
  }

  buildStateFromSchema(schema, state = {}) {
    schema.forEach((elem) => {
      if (elem instanceof ObjectBuilder) {
        state[elem._id] = {};
        this.buildStateFromSchema(elem._children, state[elem._id]);
      } else {
        state[elem._id] = elem._value;
      }
    });
    return state;
  }

  /**
   * @param {Array<Input>} schema
   * @returns {HTMLElement}
   */
  buildDOMFromSchema = (schema, onChange) => {
    const guiDOM = document.createElement("div");
    const formDOM = createForm(
      schema,
      this.setValueWithKey,
      this.getValueWithKey
    );
    const toggleFormButton = createToggleFormButton(formDOM);
    guiDOM.appendChild(formDOM);
    guiDOM.appendChild(toggleFormButton);
    return guiDOM;
  };

  static builder() {
    return new GUIBuilder();
  }
  static file = (id) => new FileBuilder(id);
  static selector = (id) => new SelectBuilder(id);
  static number = (id) => new NumberBuilder(id);
  static range = (id) => new RangeBuilder(id);
  static boolean = (id) => new BooleanBuilder(id);
  static object = (id) => new ObjectBuilder(id);
  static button = (id) => new ButtonBuilder(id);
}

//========================================================================================
/*                                                                                      *
 *                                         UTILS                                        *
 *                                                                                      */
//========================================================================================

const createForm = (schema, setValueWithKey, getValueWithKey) => {
  const formDOM = document.createElement("div");
  schema.forEach((elem) => {
    const domElem = elem.buildDOM(setValueWithKey, getValueWithKey);
    formDOM.appendChild(domElem);
  });
  return formDOM;
};

const createToggleFormButton = (formDOM) => {
  let isOpen = false;
  const CLOSE_LABEL = "Close controls";
  const OPEN_LABEL = "Open controls";
  // create button styles
  const style = document.createElement("style");
  style.textContent = `
    .form-visible {
      height: auto;
      visibility: true
    }

    .form-invisible {
      height: 0px;
      visibility: hidden
    }
  `;
  document.head.append(style);
  formDOM.setAttribute("class", isOpen ? "form-visible" : "form-invisible");

  // Create toggle button
  const button = document.createElement("button");
  button.setAttribute("class", "controlToggle");
  button.innerText = OPEN_LABEL;
  button.onclick = () => {
    isOpen = !isOpen;
    button.innerText = isOpen ? CLOSE_LABEL : OPEN_LABEL;
    formDOM.setAttribute("class", isOpen ? "form-visible" : "form-invisible");
  };

  return button;
};

//========================================================================================
/*                                                                                      *
 *                                       BUILDERS                                       *
 *                                                                                      */
//========================================================================================

class GUIBuilder {
  schema = [];
  lambdaOnChange;
  add(...schema) {
    this.schema = this.schema.concat(schema);
    return this;
  }

  onChange(lambda) {
    this.lambdaOnChange = lambda;
    return this;
  }

  build() {
    return new GUI(this.schema, this.lambdaOnChange);
  }
}

class FileBuilder {
  constructor(id) {
    this._id = id;
    this._value;
    this._label;
    this._extensions;
  }

  value(value) {
    this._value = value;
    return this;
  }
  label(label) {
    this._label = label;
    return this;
  }
  extensions(...extensions) {
    this._extensions = extensions;
    return this;
  }

  buildDOM(onChange) {}
}

class SelectBuilder {
  constructor(id) {
    this._id = id;
    this._value;
    this._label;
    this._options;
  }

  value(value) {
    this._value = value;
    return this;
  }
  label(label) {
    this._label = label;
    return this;
  }
  options(...options) {
    this._options = options;
    return this;
  }

  buildDOM(onChange) {}
}
class NumberBuilder {
  constructor(id) {
    this._id = id;
    this._value;
    this._label;
    this._min;
    this._max;
    this._step;
  }
  value(value) {
    this._value = value;
    return this;
  }
  label(label) {
    this._label = label;
    return this;
  }
  min(min) {
    this._min = min;
    return this;
  }
  max(max) {
    this._max = max;
    return this;
  }
  step(step) {
    this._step = step;
    return this;
  }

  buildDOM(onChange) {
    const input = document.createElement("input");
    input.setAttribute("type", "number");
    !min && input.setAttribute("min", min);
    !max && input.setAttribute("max", min);
    input.setAttribute("value", value || 0);
    input.onchange = (e) => {
      const value = e.target.value;
      this._id;
    };
    return input;
  }
}

class RangeBuilder {
  constructor(id) {
    this._id = id;
    this._value;
    this._label;
    this._min;
    this._max;
    this._step;
  }
  value(value) {
    this._value = value;
    return this;
  }
  label(label) {
    this._label = label;
    return this;
  }
  min(min) {
    this._min = min;
    return this;
  }
  max(max) {
    this._max = max;
    return this;
  }
  step(step) {
    this._step = step;
    return this;
  }

  buildDOM(onChange) {
    return document.createElement("div");
  }
}

class BooleanBuilder {
  constructor(id) {
    this._id = id;
    this._value = false;
    this._label;
  }
  value(value) {
    this._value = value;
    return this;
  }
  label(label) {
    this._label = label;
    return this;
  }

  buildDOM(setValueWithKey, getValueWithKey) {
    const boolDOM = document.createElement("div");
    const boolInput = document.createElement("input");
    const boolLabel = document.createElement("span");
    boolInput.setAttribute("type", "checkbox");
    boolInput.value = this._value;
    boolInput.addEventListener("change", (e) => {
      console.log("debug change, ", e.target.checked, this._id);
    });
    boolLabel.innerText = this._label;
    boolDOM.appendChild(boolLabel);
    boolDOM.appendChild(boolInput);
    return boolDOM;
  }
}

class ButtonBuilder {
  constructor(id) {
    this._id = id;
    this._onClick;
    this._label;
  }
  onClick(onClick) {
    this._onClick = onClick;
    this._value = this._onClick;
    return this;
  }
  label(label) {
    this._label = label;
    return this;
  }

  buildDOM(onChange) {}
}

class ObjectBuilder {
  constructor(id) {
    this._id = id;
    this._children;
    this._label;
  }
  children(...children) {
    this._children = children;
    return this;
  }
  label(label) {
    this._label = label;
    return this;
  }

  buildDOM(onChange) {}
}

export default GUI;
