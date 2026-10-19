// backend/src/tests/security.test.ts
import assert from "assert";
import jwt from "jsonwebtoken";
import crypto from "crypto";

console.log("🧪 Running Security & Trust Boundary Tests...\n");

// Test 1: Verify that tokens signed with forged dummy secrets are rejected
const VALID_SECRET = process.env.JWT_SECRET || "unesa_blockchain_secret_jwt_key_2026";
const FORGED_SECRET = "rahasia_default";

const validToken = jwt.sign({ id: "user-123", role: "ADMIN" }, VALID_SECRET, { expiresIn: "1h" });
const forgedToken = jwt.sign({ id: "user-123", role: "ADMIN" }, FORGED_SECRET, { expiresIn: "1h" });

// Valid token succeeds
const decodedValid = jwt.verify(validToken, VALID_SECRET) as any;
assert.strictEqual(decodedValid.id, "user-123");
assert.strictEqual(decodedValid.role, "ADMIN");
console.log("✅ Test 1 Passed: Valid token successfully verified.");

// Forged token is rejected
assert.throws(() => {
  jwt.verify(forgedToken, VALID_SECRET);
}, /invalid signature/i);
console.log("✅ Test 2 Passed: Forged token signed with 'rahasia_default' rejected.");

// Test 3: Password hash exclusion
const userMock = {
  id: "uuid-1",
  email: "admin@chainnesa.com",
  password: "$2a$10$e8wYmockedhashedpassword",
  role: "admin",
};
const { password: _, ...safeUser } = userMock;
assert.strictEqual((safeUser as any).password, undefined);
assert.strictEqual(safeUser.email, "admin@chainnesa.com");
console.log("✅ Test 3 Passed: Password hash successfully excluded from user payload.");

// Test 4: Base58 multihash CID generation
const B58_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function toBase58(buffer: Buffer): string {
  const digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) digits.push(0);
  return digits.reverse().map((d) => B58_CHARS[d]).join("");
}
const testHash = crypto.createHash("sha256").update("hello world").digest();
const multihash = Buffer.concat([Buffer.from([0x12, 0x20]), testHash]);
const cid = toBase58(multihash);
assert.strictEqual(cid, "QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4");
assert.strictEqual(cid.startsWith("Qm"), true);
assert.strictEqual(cid.length, 46);
console.log("✅ Test 4 Passed: IPFS CIDv0 multihash is canonical and spec-compliant.\n");

console.log("🎉 All 4 Security Tests Passed Successfully!");
