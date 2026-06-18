const fs = require("node:fs");
const path = require("node:path");

exports.default = async function afterPack(context) {
  const projectDir = context.packager.projectDir;
  const resourcesDir = path.join(context.appOutDir, "resources");
  const standaloneDir = path.join(
    resourcesDir,
    "app.asar.unpacked",
    ".next",
    "standalone",
  );
  const sourceNodeModules = path.join(projectDir, ".next", "standalone", "node_modules");
  const targetNodeModules = path.join(standaloneDir, "node_modules");
  const nestedDist = path.join(standaloneDir, "dist");

  if (!fs.existsSync(sourceNodeModules)) {
    throw new Error(`Missing standalone node_modules: ${sourceNodeModules}`);
  }

  fs.rmSync(targetNodeModules, { recursive: true, force: true });
  fs.cpSync(sourceNodeModules, targetNodeModules, { recursive: true });
  fs.rmSync(nestedDist, { recursive: true, force: true });
};
