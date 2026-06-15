const net = require("net");
const fs = require("fs");

const targets = [
  { host: "127.0.0.1", port: 5432 },
  { host: "127.0.0.1", port: 5433 },
  { host: "127.0.0.1", port: 5434 },
  { host: "localhost", port: 5432 },
  { host: "localhost", port: 5433 },
  { host: "172.17.112.1", port: 5432 },
  { host: "172.17.112.1", port: 5433 },
];

async function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on("connect", () => {
      socket.destroy();
      resolve({ host, port, status: "OPEN" });
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ host, port, status: "TIMEOUT" });
    });
    socket.on("error", (err) => {
      socket.destroy();
      resolve({ host, port, status: "ERROR", message: err.message });
    });
    socket.connect(port, host);
  });
}

async function run() {
  const results = [];
  for (const target of targets) {
    console.log(`Checking ${target.host}:${target.port}...`);
    results.push(await checkPort(target.host, target.port));
  }
  fs.writeFileSync("network_probe.json", JSON.stringify(results, null, 2));
  console.log("Results written to network_probe.json");
}

run();
