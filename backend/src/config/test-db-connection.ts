import { Pool } from "pg";
import "dotenv/config";
import * as dns from "dns";
import * as util from "util";

const lookup = util.promisify(dns.lookup);

async function main() {
  console.log("\n🧪 STARTING DB CONNECTION TEST\n");

  const host = process.env.DB_HOST || "localhost";
  const port = parseInt(process.env.DB_PORT || "5432", 10);
  const user = process.env.DB_USER || "postgres";
  const database = process.env.DB_NAME || "chainnesa_db";
  const password = process.env.DB_PASSWORD;

  console.log(`Configured Host: ${host}`);
  console.log(`Configured Port: ${port}`);
  console.log(`Configured DB:   ${database}`);

  // 1. Resolve DNS Manually to see where it points
  try {
    console.log(`\n🔍 Resolving DNS for '${host}'...`);
    const { address, family } = await lookup(host);
    console.log(`   ✅ Resolved IP: ${address} (IPv${family})`);
  } catch (err: any) {
    console.error(`   ❌ DNS Resolution Failed: ${err.message}`);
    console.log(
      "   (Continuing anyway, driver might handle it differently...)"
    );
  }

  // 2. Attempt Connection
  const pool = new Pool({
    host,
    port,
    user,
    password,
    database,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log("\n🔌 Connecting...");
    const client = await pool.connect();
    console.log("   ✅ SOCKET CONNECTED!");

    const res = await client.query("SELECT version(), inet_server_addr()");
    console.log(`   ✅ QUERY SUCCESS!`);
    console.log(`   👉 Postgres Version: ${res.rows[0].version}`);
    console.log(`   👉 Server IP Seen:   ${res.rows[0].inet_server_addr}`);

    client.release();
  } catch (err: any) {
    console.error("\n❌ CONNECTION FAILED");
    console.error(`   Code:    ${err.code}`);
    console.error(`   Message: ${err.message}`);

    if (err.message.includes("ECONNREFUSED")) {
      console.log("\n💡 HINT: 'ECONNREFUSED' usually means:");
      console.log("   1. Windows Firewall is blocking Port 5433.");
      console.log("   2. Postgres is not listening on that IP or Port.");
      console.log(
        "   3. You are connecting to localhost (WSL) instead of Windows IP."
      );
    }
  } finally {
    await pool.end();
  }
}

main();
