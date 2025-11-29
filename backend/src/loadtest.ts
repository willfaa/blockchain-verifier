import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

const API_BASE = process.env.LOADTEST_API_BASE ?? "http://localhost:4000";

interface SampleCert {
  nim: string;
  name: string;
  majority: string;
  program: string;
  filePath: string; // relatif ke folder samples
}

const sampleCerts: SampleCert[] = [
  // kecil ~100 KB
  {
    nim: "21050974001",
    name: "User Kecil 1",
    majority: "Informatics",
    program: "S1 PTI",
    filePath: "smallTest.pdf",
  },
  // sedang ~500 KB
  // {
  //   nim: "21050974002",
  //   name: "User Sedang 1",
  //   majority: "Informatics",
  //   program: "S1 PTI",
  //   filePath: "mediumTest.pdf",
  // },
  // besar ~2 MB
  // {
  //   nim: "21050974003",
  //   name: "User Besar 1",
  //   majority: "Informatics",
  //   program: "S1 PTI",
  //   filePath: "largeTest.pdf",
  // },
];

const latencies: number[] = [];

async function issueOnce(sample: SampleCert, index: number): Promise<void> {
  const fileAbs = path.resolve(__dirname, "..", "samples", sample.filePath);

  if (!fs.existsSync(fileAbs)) {
    console.error(`#${index} SKIP: file tidak ditemukan ->`, fileAbs);
    return;
  }

  const fileStream = fs.createReadStream(fileAbs);
  const form = new FormData();

  form.append("nim", sample.nim);
  form.append("name", sample.name);
  form.append("majority", sample.majority);
  form.append("program", sample.program);
  form.append("file", fileStream);

  const headers = form.getHeaders();

  const start = Date.now(); // ⬅ mulai timing

  try {
    const resp = await axios.post(`${API_BASE}/issue`, form, { headers });
    const duration = Date.now() - start; // ⬅ durasi dalam ms
    latencies.push(duration);

    console.log(
      `#${index} OK -> certId=${resp.data.certId}, cid=${resp.data.cid}, ${duration} ms`
    );
  } catch (err: any) {
    const duration = Date.now() - start;
    console.error(
      `#${index} FAIL (${duration} ms):`,
      err.response?.data ?? err.message
    );
  }
}

async function main(): Promise<void> {
  const runs = Number(process.env.LOADTEST_RUNS ?? "10");

  console.log(
    `Mulai load test: ${runs} permintaan /issue ke ${API_BASE} (paralel).`
  );

  const tasks: Promise<void>[] = [];
  for (let i = 0; i < runs; i++) {
    const sample = sampleCerts[i % sampleCerts.length];
    tasks.push(issueOnce(sample, i + 1));
  }

  await Promise.allSettled(tasks);
  if (latencies.length > 0) {
    const sum = latencies.reduce((a, b) => a + b, 0);
    const avg = sum / latencies.length;
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);

    console.log("===== Load Test Summary =====");
    console.log(`Total OK      : ${latencies.length}`);
    console.log(`Avg latency   : ${avg.toFixed(1)} ms`);
    console.log(`Min latency   : ${min} ms`);
    console.log(`Max latency   : ${max} ms`);
  } else {
    console.log("Tidak ada request yang berhasil, tidak ada data latency.");
  }
  console.log("Load test selesai.");
}

main().catch((err) => {
  console.error("Load test error fatal:", err);
  process.exit(1);
});
