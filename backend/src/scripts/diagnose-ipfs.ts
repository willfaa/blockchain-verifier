import axios from "axios";
import FormData from "form-data";

const IPFS_API_URL = process.env.IPFS_API || "http://127.0.0.1:5001";

async function diagnose() {
  console.log(`🔍 Diagnosing IPFS connection to: ${IPFS_API_URL}`);

  // Test 1: Connectivity (Version/ID)
  try {
    console.log("\n1. Testing Connectivity (/api/v0/id)...");
    const idRes = await axios.post(`${IPFS_API_URL}/api/v0/id`);
    console.log("✅ Connectivity Success!");
    console.log(`   - ID: ${idRes.data.ID}`);
    console.log(`   - Agent: ${idRes.data.AgentVersion}`);
  } catch (error: any) {
    console.error("❌ Connectivity Failed:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.error(
        "   - Suggestion: IPFS Desktop might not be running or is not listening on 0.0.0.0. Check 'Gateways' config in IPFS Desktop."
      );
    }
    return;
  }

  // Test 2: Upload (Add)
  try {
    console.log("\n2. Testing File Upload (/api/v0/add)...");
    const form = new FormData();
    form.append("file", Buffer.from("Hello from WSL Diagnostic"), "test.txt");

    const addRes = await axios.post(`${IPFS_API_URL}/api/v0/add`, form, {
      headers: form.getHeaders(),
    });
    console.log("✅ Upload Success!");
    console.log(`   - Hash: ${addRes.data.Hash}`);
  } catch (error: any) {
    console.error("❌ Upload Failed:", error.message);
    if (error.response) {
      console.error("   - Status:", error.response.status);
      console.error("   - Data:", JSON.stringify(error.response.data));
      if (error.response.data.Message?.includes("cannot find path specified")) {
        console.error(
          "   - DIAGNOSIS: The IPFS Node (Windows) cannot write to its internal Repo path."
        );
        console.error(
          "   - CAUSE: Likely a permissions issue or corruption in C:\\Users\\...\\.ipfs\\blocks"
        );
      }
    }
  }

  // Test 3: MFS Write/List (Permission Check)
  try {
    console.log("\n3. Testing MFS Write & List (/api/v0/files/...)");

    // Write to MFS
    console.log("   - Writing /test-diagnostic.txt...");
    const form = new FormData();
    form.append("file", Buffer.from("MFS Check"), "test.txt");
    await axios.post(
      `${IPFS_API_URL}/api/v0/files/write?arg=/test-diagnostic.txt&create=true&truncate=true`,
      form,
      {
        headers: form.getHeaders(),
      }
    );
    console.log("   - Write Success!");

    // List Root
    console.log("   - Listing /...");
    const listRes = await axios.post(`${IPFS_API_URL}/api/v0/files/ls?arg=/`);
    console.log(
      "   - List Success! Entries found:",
      listRes.data.Entries?.length || 0
    );
  } catch (error: any) {
    console.error("❌ MFS Test Failed:", error.message);
    if (error.response) {
      console.error("   - Status:", error.response.status);
      console.error("   - Data:", JSON.stringify(error.response.data));
    }
  }
}

diagnose();
