const { app, BrowserWindow, dialog, shell } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const isDev = !app.isPackaged;
const DEFAULT_PORT = 3567;
const HOSTNAME = "127.0.0.1";

let mainWindow = null;
let serverProcess = null;

function resolveServerDir() {
  if (isDev) return path.join(__dirname, "..", ".next", "standalone");
  return path.join(process.resourcesPath, "app.asar.unpacked", ".next", "standalone");
}

function findFreePort(startPort) {
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      const server = net.createServer();
      server.unref();
      server.once("error", () => tryPort(port + 1));
      server.listen(port, HOSTNAME, () => {
        const address = server.address();
        server.close(() => resolve(typeof address === "object" && address ? address.port : port));
      });
    };
    try {
      tryPort(startPort);
    } catch (error) {
      reject(error);
    }
  });
}

function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const response = await fetch(url);
        if (response.ok || response.status < 500) {
          resolve();
          return;
        }
      } catch {
        // server not ready yet
      }
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error(`API nie uruchomiło się w czasie ${timeoutMs / 1000}s.`));
        return;
      }
      setTimeout(tick, 350);
    };
    tick();
  });
}

async function startBundledServer() {
  const serverDir = resolveServerDir();
  const serverEntry = path.join(serverDir, "server.js");
  if (!fs.existsSync(serverEntry)) {
    throw new Error(`Nie znaleziono serwera Next.js: ${serverEntry}. Uruchom najpierw npm run build.`);
  }

  const port = await findFreePort(Number(process.env.LOCALDB_APP_PORT) || DEFAULT_PORT);
  const dataDir = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(dataDir, { recursive: true });

  serverProcess = spawn(process.execPath, [serverEntry], {
    cwd: serverDir,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME,
      LOCALDB_DATA_DIR: dataDir,
      ELECTRON_RUN_AS_NODE: "1",
    },
    stdio: isDev ? "inherit" : "pipe",
    windowsHide: true,
  });

  serverProcess.once("exit", (code) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog.showErrorBox("LocalDB Panel", `Wbudowane API zostało zamknięte. Kod: ${code ?? "brak"}`);
      mainWindow.close();
    }
  });

  await waitForServer(`http://${HOSTNAME}:${port}/api/databases`);
  return `http://${HOSTNAME}:${port}`;
}

function createWindow(appUrl) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#18181b",
    title: "LocalDB Panel",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(appUrl);
}

app.whenReady().then(async () => {
  try {
    const appUrl = isDev && process.env.ELECTRON_RENDERER_URL
      ? process.env.ELECTRON_RENDERER_URL
      : await startBundledServer();
    createWindow(appUrl);
  } catch (error) {
    dialog.showErrorBox("LocalDB Panel", error instanceof Error ? error.message : String(error));
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0 && mainWindow) {
    mainWindow.show();
  }
});

app.on("before-quit", () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on("window-all-closed", () => {
  app.quit();
});
