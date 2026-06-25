const { spawnSync } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const scriptArg = process.argv[2];
if (!scriptArg) {
  console.error("Usage: node scripts/run-k6.js <path-to-script.js>");
  process.exit(1);
}

const scriptPath = path.resolve(scriptArg);
const scriptName = path.basename(scriptPath);
const loadtestsDir = path.dirname(scriptPath);
const hostBaseUrl = process.env.BASE_URL ?? "http://localhost:3000";

function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(`${url.replace(/\/$/, "")}/api/health`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function run(cmd, args, env) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: env ?? process.env,
  });
  return result.status ?? 1;
}

function dockerBaseUrl(url) {
  if (url.includes("localhost")) {
    return url.replace("localhost", "host.docker.internal");
  }
  if (url.includes("127.0.0.1")) {
    return url.replace("127.0.0.1", "host.docker.internal");
  }
  return url;
}

async function main() {
  const healthy = await probe(hostBaseUrl);
  if (!healthy) {
    console.error(`\nLoad test aborted: ${hostBaseUrl}/api/health is not reachable.`);
    console.error("Start the app first: npm run dev\n");
    process.exit(1);
  }

  const k6Env = { ...process.env, BASE_URL: hostBaseUrl };
  const local = run("k6", ["run", scriptPath], k6Env);
  if (local === 0) process.exit(0);

  const localMissing = spawnSync("k6", ["version"], { stdio: "pipe", shell: process.platform === "win32" });
  if (!localMissing.error && localMissing.status === 0) {
    process.exit(local);
  }

  const containerUrl = dockerBaseUrl(hostBaseUrl);
  console.log("k6 not found locally — running via Docker (grafana/k6)...");

  const dockerArgs = [
    "run",
    "--rm",
    "-i",
    "--add-host=host.docker.internal:host-gateway",
    `-v=${loadtestsDir}:/scripts`,
    "-e",
    `BASE_URL=${containerUrl}`,
    "grafana/k6",
    "run",
    `/scripts/${scriptName}`,
  ];

  process.exit(run("docker", dockerArgs));
}

main();
