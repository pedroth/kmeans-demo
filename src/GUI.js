class GUI {
  constructor(schema, onChangeLambda) {
    this.schema = schema;
    this.state = this.buildStateFromSchema(schema);
    this.id2key = this.buildId2KeyMapFromSchema(schema);
    this.DOM = this.buildDOMFromSchema(schema);
    this.onChangeLambda = onChangeLambda;
  }

  getDOM() {
    return this.DOM;
  }

  setValueWithKey = (key, value) => {
    const oldState = { ...this.state };
    try {
      const keys = this.id2key[key];
      const lastIndex = keys.length - 1;
      let objValue = undefined;
      for (let i = 0; i < lastIndex; i++) {
        objValue = this.state[keys[i]];
      }
      if (objValue === undefined) {
        this.state[keys[0]] = value;
      } else {
        objValue[keys[lastIndex]] = value;
      }
    } catch (error) {
      // do nothing
    }
    this.onChangeLambda(this.state, oldState);
    return this;
  };

  getValueWithKey = (key) => {
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
  };

  buildId2KeyMapFromSchema(schema, parents = [], map = {}) {
    schema.forEach((elem) => {
      if (elem instanceof ObjectBuilder) {
        this.buildId2KeyMapFromSchema(
          elem._children,
          parents.concat([elem._id]),
          map
        );
      } else {
        map[elem._id] = [...parents, elem._id];
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
    this._onload;
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

  onload(onloadLambda) {
    this._onload = onloadLambda;
    return this;
  }

  buildDOM(setValueWithKey) {
    const fileDOM = document.createElement("div");
    const labelDOM = document.createElement("span");
    const fileInnerDOM = document.createElement("input");
    fileInnerDOM.setAttribute("type", "file");
    fileInnerDOM.setAttribute("accept", this._extensions.join(", "));
    fileInnerDOM.onchange = (e) => {
      const reader = new FileReader();
      reader.onload = this._onload;
      reader.readAsDataURL(e.target.files[0]);
    };
    labelDOM.innerText = this._label;
    fileDOM.appendChild(labelDOM);
    fileDOM.appendChild(fileInnerDOM);
    return fileDOM;
  }
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
  options(options) {
    this._options = options;
    return this;
  }

  buildDOM(setValueWithKey) {
    const selectDOM = document.createElement("div");
    const selectLabel = document.createElement("span");
    const selectInnerDOM = document.createElement("select");
    this._options.forEach(({ label, value }) => {
      const option = document.createElement("option");
      option.setAttribute("value", value);
      option.innerText = label;
      selectInnerDOM.appendChild(option);
    });
    selectInnerDOM.onchange = (e) => {
      setValueWithKey(this._id, e.target.selectedOptions[0].value);
    };
    selectLabel.innerText = this._label;
    selectDOM.appendChild(selectLabel);
    selectDOM.appendChild(selectInnerDOM);
    return selectDOM;
  }
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

  buildDOM(setValueWithKey) {
    const numberDOM = document.createElement("div");
    const numberInput = document.createElement("input");
    const numberLabel = document.createElement("span");
    numberInput.setAttribute("type", "number");
    numberInput.value = this._value;
    !!this._min && numberInput.setAttribute("min", this._min);
    !!this._max && numberInput.setAttribute("max", this._max);
    !!this._step && numberInput.setAttribute("step", this._step);
    numberInput.addEventListener("change", (e) => {
      setValueWithKey(this._id, Number.parseFloat(e.target.value));
    });
    numberLabel.innerText = this._label;
    numberDOM.appendChild(numberLabel);
    numberDOM.appendChild(numberInput);
    return numberDOM;
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

  buildDOM(setValueWithKey) {
    const numberDOM = document.createElement("div");
    const rangeInput = document.createElement("input");
    const numberInput = document.createElement("input");
    const numberLabel = document.createElement("span");
    numberInput.setAttribute("type", "number");
    rangeInput.setAttribute("type", "range");
    !!this._min && numberInput.setAttribute("min", this._min);
    !!this._min && rangeInput.setAttribute("min", this._min);
    !!this._max && numberInput.setAttribute("max", this._max);
    !!this._max && rangeInput.setAttribute("max", this._max);
    !!this._step && numberInput.setAttribute("step", this._step);
    !!this._step && rangeInput.setAttribute("step", this._step);
    numberInput.addEventListener("change", (e) => {
      const value = Number.parseFloat(e.target.value);
      rangeInput.value = value;
      setValueWithKey(this._id, value);
    });
    rangeInput.addEventListener("change", (e) => {
      const value = Number.parseFloat(e.target.value);
      numberInput.value = value;
      setValueWithKey(this._id, value);
    });
    numberLabel.innerText = this._label;

    numberInput.value = this._value;
    rangeInput.value = this._value;

    numberDOM.appendChild(numberLabel);
    numberDOM.appendChild(rangeInput);
    numberDOM.appendChild(numberInput);
    return numberDOM;
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

  buildDOM(setValueWithKey) {
    const boolDOM = document.createElement("div");
    const boolInput = document.createElement("input");
    const boolLabel = document.createElement("span");
    boolInput.setAttribute("type", "checkbox");
    if (this._value) boolInput.setAttribute("checked", true);
    boolInput.addEventListener("change", (e) => {
      setValueWithKey(this._id, e.target.checked);
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

  buildDOM() {
    const button = document.createElement("button");
    button.innerText = this._label;
    button.onclick = this._onClick;
    return button;
  }
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

  buildDOM(setValueWithKey) {
    const objectDom = document.createElement("details");
    if (!!this._label) {
      const label = document.createElement("summary");
      label.innerText = this._label;
      objectDom.appendChild(label);
    }
    const childrenSpace = document.createElement("div");
    childrenSpace.setAttribute("style", "padding-left: 1em");
    this._children.forEach((c) => {
      const domChildren = c.buildDOM(setValueWithKey);
      childrenSpace.appendChild(domChildren);
    });
    objectDom.appendChild(childrenSpace);
    return objectDom;
  }
}

export default GUI;
