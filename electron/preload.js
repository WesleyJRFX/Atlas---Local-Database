const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("localDbDesktop", {
  platform: process.platform,
});
