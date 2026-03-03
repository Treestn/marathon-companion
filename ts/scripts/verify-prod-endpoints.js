const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const endpointFile = path.join(
  root,
  "src",
  "shared",
  "services",
  "api",
  "tarkov-companion",
  "endpoint.ts"
);
const distJsDir = path.join(root, "dist", "js");

const requiredHosts = {
  hostname: "https://companions-api.treestn-dev.ca",
  submissionHostname: "https://companions-submissions.treestn-dev.ca",
};
const forbiddenHosts = ["http://localhost", "https://localhost", "127.0.0.1"];

function fail(message) {
  const red = "\x1b[31m";
  const reset = "\x1b[0m";
  console.error(`\n${red}[verify:prod-endpoints] ${message}${reset}\n`);
  process.exit(1);
}

function getActiveConstStringValue(source, constName) {
  const prefix = `const ${constName} =`;
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || !trimmed.startsWith(prefix)) {
      continue;
    }

    const valuePart = trimmed.slice(prefix.length).trim().replace(/;$/, "");
    const match = valuePart.match(/^["']([^"']+)["']$/);
    return match ? match[1] : null;
  }

  return null;
}

function verifySourceEndpoints() {
  const source = fs.readFileSync(endpointFile, "utf8");

  for (const [constName, expectedHost] of Object.entries(requiredHosts)) {
    const activeValue = getActiveConstStringValue(source, constName);
    if (!activeValue) {
      fail(`Could not find active const assignment for "${constName}" in endpoint.ts.`);
    }

    if (activeValue !== expectedHost) {
      fail(
        `Expected ${constName} to be "${expectedHost}" but found "${activeValue}" in endpoint.ts.`
      );
    }
  }

  // Only treat uncommented localhost lines as a failure.
  const uncommentedLocalhost = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("const "))
    .some((line) => forbiddenHosts.some((host) => line.includes(host)));

  if (uncommentedLocalhost) {
    fail("Found uncommented localhost endpoint in endpoint.ts.");
  }
}

function verifyDistBundle() {
  if (!fs.existsSync(distJsDir)) {
    fail("dist/js does not exist. Run a production build first (npm run prod).");
  }

  const jsFiles = fs
    .readdirSync(distJsDir)
    .filter((file) => file.endsWith(".js"))
    .map((file) => path.join(distJsDir, file));

  if (jsFiles.length === 0) {
    fail("No JS bundles found under dist/js.");
  }

  const allJsContents = jsFiles
    .map((filePath) => fs.readFileSync(filePath, "utf8"))
    .join("\n");

  const foundLocalhost = forbiddenHosts.find((host) =>
    allJsContents.includes(host)
  );
  if (foundLocalhost) {
    fail(`Production bundle contains forbidden host: ${foundLocalhost}`);
  }

  const missingRequiredHost = Object.values(requiredHosts).find(
    (host) => !allJsContents.includes(host)
  );
  if (missingRequiredHost) {
    fail(`Production bundle is missing required host: ${missingRequiredHost}`);
  }
}

verifySourceEndpoints();
verifyDistBundle();
console.log("[verify:prod-endpoints] OK");
