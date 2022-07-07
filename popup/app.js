const { Popup } = require("./popup.js");

import { CONFIG_CHANNEL } from "../static/constants";

window.addEventListener("DOMContentLoaded", () => {
  localStorage.setItem("IS_POPUP_ACTIVE", "true");
});

/*
  WINDOW RESTRICTIONS & DEVELOPER MODE
*/
const outerWidth = window.outerWidth;
const outerHeight = window.outerHeight;
let isResized = null;
const windowResizeHandler = () => {
  clearTimeout(isResized);
  isResized = setTimeout(() => {
    window.resizeTo(outerWidth, outerHeight);
  }, 200);
};

const windowUnloadHandler = (event) => {
  localStorage.clear();
  event.preventDefault();
  return (event.returnValue = "");
};

const windowContextHandler = (event) => {
  //event.preventDefault();
  return false;
};

window.addEventListener("resize", windowResizeHandler);
window.addEventListener("beforeunload", windowUnloadHandler);
window.addEventListener("contextmenu", windowContextHandler);

let popup = null;

const config_channel = new BroadcastChannel(CONFIG_CHANNEL);
config_channel.onmessage = (event) => {
  console.log(event);
  let { sip, password, server_address, port } = event.data;
  popup = new Popup({
    sip: sip,
    password: password,
    server_address: server_address,
    port: port,
  });

  main();
};

function main() {
  popup.connect(() => {
    document.querySelector("h2").textContent = "CONNECTED";
    document.querySelector(".ripple").remove();
  });
}
