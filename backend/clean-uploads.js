const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config();

// Determine connection URL (using local by default unless DATABASE_URL is overridden)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not defined in backend/.env!");
  process.exit(1);
}

const isForce = process.argv.includes("--force");

// Normalizer: Convert various DB URL/path formats to a standard 'uploads/...' relative path
function normalizeDbPath(url) {
  if (!url || typeof url !== "string") return null;
  
  // 1. Matches full URLs like http://localhost:4000/uploads/avatars/abc.jpg
  const match = url.match(/\/uploads\/(.+)/i);
  if (match) {
    return "uploads/" + match[1];
  }
  
  // 2. Matches starting with /uploads/
  if (url.startsWith("/uploads/")) {
    return url.substring(1);
  }
  
  // 3. Matches starting with uploads/
  if (url.startsWith("uploads/")) {
    return url;
  }
  
  return null;
}

// Recursively find all files in the directory
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;

  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Store standard forward-slash path relative to project root
      const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");
      arrayOfFiles.push({
        path: relativePath,
        size: fs.statSync(fullPath).size
      });
    }
  });

  return arrayOfFiles;
}

// Recursively clean empty directories
function cleanEmptyDirs(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  const files = fs.readdirSync(dirPath);
  if (files.length > 0) {
    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        cleanEmptyDirs(fullPath);
      }
    });
  }

  // Re-read after cleaning subdirectories
  const filesAfter = fs.readdirSync(dirPath);
  const uploadsRoot = path.join(process.cwd(), "uploads");
  
  if (filesAfter.length === 0 && dirPath !== uploadsRoot) {
    fs.rmdirSync(dirPath);
    console.log(`📁 Removed empty directory: ${path.relative(process.cwd(), dirPath).replace(/\\/g, "/")}`);
  }
}

async function cleanGarbage() {
  console.log(`\n🧹 Starting Uploads Garbage Collector (${isForce ? "DELETE MODE" : "DRY-RUN MODE"})`);
  console.log(`📡 Database: ${connectionString.replace(/:[^:@]+@/, ":****@")}\n`);

  const client = new Client({ connectionString });
  
  try {
    await client.connect();

    const referencedFiles = new Set();

    // Query all tables referencing uploaded files
    const queries = [
      { q: "SELECT avatar as file FROM users", label: "users (avatars)" },
      { q: "SELECT \"imageUrl\" as file FROM courses", label: "courses (covers)" },
      { q: "SELECT \"videoUrl\" as file FROM lessons", label: "lessons (videos)" },
      { q: "SELECT url as file FROM attachments", label: "attachments (files)" },
      { q: "SELECT \"fileUrl\" as file FROM assignment_submissions", label: "submissions (assignments)" }
    ];

    for (const item of queries) {
      try {
        const { rows } = await client.query(item.q);
        rows.forEach(row => {
          const norm = normalizeDbPath(row.file);
          if (norm) referencedFiles.add(norm);
        });
      } catch (err) {
        console.warn(`⚠️ Warning: Failed to query ${item.label}. This table might not exist yet: ${err.message}`);
      }
    }

    console.log(`📋 Total database references: ${referencedFiles.size}`);

    // Scan actual files on disk
    const uploadsDir = path.join(process.cwd(), "uploads");
    const diskFiles = getAllFiles(uploadsDir);
    console.log(`💾 Files found in "uploads/": ${diskFiles.length}\n`);

    let unusedCount = 0;
    let unusedBytes = 0;

    for (const file of diskFiles) {
      // Check if file path is in the database set
      if (!referencedFiles.has(file.path)) {
        unusedCount++;
        unusedBytes += file.size;
        
        console.log(`🗑️ Unused: ${file.path} (${(file.size / 1024).toFixed(2)} KB)`);
        
        if (isForce) {
          try {
            fs.unlinkSync(path.join(process.cwd(), file.path));
          } catch (delErr) {
            console.error(`❌ Failed to delete ${file.path}:`, delErr.message);
          }
        }
      }
    }

    if (isForce && unusedCount > 0) {
      console.log("\n🧹 Cleaning empty folders...");
      cleanEmptyDirs(uploadsDir);
    }

    console.log("\n========================================");
    console.log(`📊 SUMMARY:`);
    console.log(`   - Total Files Scanned: ${diskFiles.length}`);
    console.log(`   - In-Use Files:        ${diskFiles.length - unusedCount}`);
    console.log(`   - Unused Files found:  ${unusedCount}`);
    console.log(`   - Total Space Savings: ${(unusedBytes / (1024 * 1024)).toFixed(2)} MB`);
    console.log("========================================");

    if (!isForce) {
      console.log("\n💡 Note: This was a DRY RUN. No files were deleted.");
      console.log("👉 Run 'npm run clean-uploads -- --force' to permanently delete these files.");
    } else {
      console.log("\n✅ Cleanup completed. Database references and filesystem aligned.");
    }

  } catch (err) {
    console.error("❌ Critical error during cleanup:", err.message);
  } finally {
    await client.end();
  }
}

cleanGarbage();
