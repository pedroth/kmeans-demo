const fromType = (type) => (props, value) => {
  const type2Builder = {
    number: FromNumber,
    range: FromRange,
    file: FromFile,
    selector: FromSelector,
    object: GUI.FromForm,
  };
  return type2Builder[type](props, value);
};

const GUI = {
  /**
   * @param {Array<Input>} form
   * @returns {HTMLElement}
   */
  fromForm: (form) => {
    const div = document.createElement("div");
    const data = {};
    form.forEach(({ type, props, value }) => {
      const { dom, value } = fromType(type)(props, value);
      div.appendChild(dom);
    });
    return { dom: div, value: data };
  },

  /**
   *
   * @param {{id: String, label: String, extensions: Array<String>}} options
   */
  file: ({ id, label, extensions }) => ({
    type: "file",
    id,
    label,
    extensions,
  }),

  selector: ({ id, label, options, value }) => ({
    type: "selector",
    id,
    label,
    options,
    value,
  }),

  number: ({ id, label, min = 0, max, step = 1 }) => ({
    type: "number",
    id,
    label,
    min,
    max,
    step,
  }),

  range: ({ id, label, min = 0, step = 0.01, max = 1, withInput = true }) => ({
    type: "range",
    id,
    label,
    min,
    step,
    max,
    withInput,
  }),

  object: ({ children = [], layout = "column" }) => ({
    type: "object",
    children,
    layout,
  }),
};

const NUMBER = ({ title, value, min, max, step }) => {
  const input = document.createElement("input");
  input.setAttribute("type", "number");
  !min && input.setAttribute("min", min);
  !max && input.setAttribute("max", min);
  input.setAttribute("value", value || 0);
  input.onchange = (e) => {
    numberOfCluster = e.target.value;
    initClusters();
    updateTable();
  };
};

export default GUI;
