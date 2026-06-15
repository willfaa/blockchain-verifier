const { Client } = require("pg");

async function testConnection(host, port, user, password, database) {
  const client = new Client({
    host,
    port,
    user,
    password,
    database,
    connectionTimeoutMillis: 2000,
  });

  try {
    console.log(`[TEST] Connecting to ${host}:${port}...`);
    await client.connect();
    console.log(`[PASS] Connected to ${host}:${port}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`[FAIL] ${host}:${port} - ${err.message}`);
    return false;
  }
}

const hosts = ["127.0.0.1", "localhost", "172.17.112.1"];
const ports = [5433, 5432];

async function runAll() {
  for (const host of hosts) {
    for (const port of ports) {
      await testConnection(host, port, "postgres", "willfaa", "chainnesa_db");
    }
  }
}

runAll();
