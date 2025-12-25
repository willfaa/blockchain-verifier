import { generateInstitutionalEmail } from "./src/utils/emailGenerator";

const testCases = [
  "Budi Santoso",
  "Muhammad Fajar Hidayat",
  "Super Longnameever",
  "John Doe",
  "SingleName",
];

async function runTests() {
  console.log("--- Testing Email Generator ---");
  for (const name of testCases) {
    const email = await generateInstitutionalEmail(name);
    console.log(`Input: "${name}" -> Output: ${email}`);
  }
}

// We can't easily test collision without inserting, but we can verify the base format.
runTests().catch(console.error);
