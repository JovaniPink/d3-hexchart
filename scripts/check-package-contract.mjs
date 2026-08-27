import { readFileSync } from "node:fs";

const expectedPackageManager = "npm@11.19.1";
const requiredSettings = new Map([
  ["engine-strict", "true"],
  ["strict-allow-scripts", "true"],
]);

function readJson(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
}

function fail(message) {
  console.error(`Package contract failed: ${message}`);
  process.exitCode = 1;
}

const packageJson = readJson("../package.json");
const packageLock = readJson("../package-lock.json");
const npmrc = new Map(
  readFileSync(new URL("../.npmrc", import.meta.url), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("=", 2)),
);

if (packageJson.packageManager !== expectedPackageManager) {
  fail(
    `packageManager must be ${expectedPackageManager}; received ${packageJson.packageManager ?? "nothing"}.`,
  );
}

const npmVersion = process.env.npm_config_user_agent?.match(/^npm\/([^ ]+)/)?.[1];
if (npmVersion !== expectedPackageManager.slice(4)) {
  fail(
    `run the gate through Corepack (${expectedPackageManager}); received npm ${npmVersion ?? "unknown"}.`,
  );
}

for (const [setting, expectedValue] of requiredSettings) {
  if (npmrc.get(setting) !== expectedValue) {
    fail(`.npmrc must set ${setting}=${expectedValue}.`);
  }

  const environmentName = `npm_config_${setting.replaceAll("-", "_")}`;
  if (process.env[environmentName] !== expectedValue) {
    fail(
      `${setting} must be effective during the gate; received ${process.env[environmentName] ?? "nothing"}.`,
    );
  }
}

if (process.env.npm_config_dangerously_allow_all_scripts === "true") {
  fail("dangerously-allow-all-scripts must not bypass the repository policy.");
}

const lockedInstallScripts = Object.entries(packageLock.packages)
  .filter(([, metadata]) => metadata.hasInstallScript)
  .map(([path, metadata]) => {
    const name = path.split("node_modules/").at(-1);
    return { name, spec: `${name}@${metadata.version}` };
  })
  .sort((left, right) => left.spec.localeCompare(right.spec));

const installScriptDecisions = packageJson.allowScripts ?? {};
const invalidDecisions = Object.entries(installScriptDecisions)
  .filter(([, decision]) => typeof decision !== "boolean")
  .map(([name]) => name);

if (invalidDecisions.length > 0) {
  fail(`install-script decisions must be booleans: ${invalidDecisions.join(", ")}.`);
}

const uncoveredInstallScripts = lockedInstallScripts.filter(
  ({ name, spec }) =>
    installScriptDecisions[spec] !== true && installScriptDecisions[name] !== false,
);

if (uncoveredInstallScripts.length > 0) {
  fail(
    `locked install scripts need an exact approval or name-level denial: ${uncoveredInstallScripts.map(({ spec }) => spec).join(", ")}.`,
  );
}

const coveredDecisionKeys = new Set(
  lockedInstallScripts.flatMap(({ name, spec }) => [name, spec]),
);
const staleDecisions = Object.keys(installScriptDecisions).filter(
  (name) => !coveredDecisionKeys.has(name),
);

if (staleDecisions.length > 0) {
  fail(
    `remove install-script decisions after the dependency leaves the lockfile: ${staleDecisions.join(", ")}.`,
  );
}

if (!process.exitCode) {
  const decisions = Object.entries(installScriptDecisions)
    .map(([name, approved]) => `${name} ${approved ? "approved" : "denied"}`)
    .join(", ");
  console.log(
    `Package contract verified with ${expectedPackageManager}; install-script decisions: ${decisions || "none"}.`,
  );
}
