const EMPTY_FUNCTION = () => {};
const EMPTY_NODE_FUNCTION = () => document.createElement("div");
const BACKGROUND_STYLE = {
  position: "fixed",
  display: "-webkit-box",
  display: "-webkit-flex",
  display: "-ms-flexbox",
  display: "flex",
  WebkitAlignItems: "center",
  WebkitBoxAlign: "center",
  MsFlexAlign: "center",
  alignItems: "center",
  WebkitBoxPack: "center",
  MsFlexPack: "center",
  WebkitJustifyContent: "center",
  justifyContent: "center",
  right: "0",
  bottom: "0",
  top: "0",
  left: "0",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  WebkitTapHighlightColor: "transparent",
  zIndex: "999",
};
const ALERT_STYLE = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "400px",
  backgroundColor: "rgb(18, 18, 18)",
  border: "2px solid rgb(0, 0, 0)",
  boxShadow:
    "rgba(0, 0, 0, 0.2) 0px 11px 15px -7px, rgba(0, 0, 0, 0.14) 0px 24px 38px 3px, rgba(0, 0, 0, 0.12) 0px 9px 46px 8px",
  padding: "16px 32px 24px",
  zIndex: 9999,
};
const modalContainer = document.createElement("div");
document.body.appendChild(modalContainer);

function closeModal() {
  modalContainer.innerHTML = "";
}

function getBackground(onClose) {
  const background = document.createElement("div");
  Object.assign(background.style, BACKGROUND_STYLE);
  background.onclick = () => {
    onClose();
    closeModal();
  };
  return background;
}

function getAlertComponent(htmlFactory) {
  const alertContainer = document.createElement("div");
  Object.assign(alertContainer.style, ALERT_STYLE);
  alertContainer.appendChild(htmlFactory(closeModal));
  return alertContainer;
}

export default function alertModal(
  htmlFactory = EMPTY_NODE_FUNCTION,
  onClose = EMPTY_FUNCTION
) {
  closeModal();
  const background = getBackground(onClose);
  const alertDiv = getAlertComponent(htmlFactory);
  modalContainer.appendChild(background);
  modalContainer.appendChild(alertDiv);
}
