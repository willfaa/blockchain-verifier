import { create } from "ipfs-http-client";

const client = create({
  url: "http://127.0.0.1:5001/api/v0",
});

// mfsPath dibuat OPTIONAL pakai tanda ?
export async function uploadToIpfs(fileBuffer: Buffer, mfsPath?: string) {
  // simpan ke blockstore (CID utama)
  const result = await client.add(fileBuffer);
  const cid = result.cid.toString();

  // kalau mfsPath dikasih, tulis juga ke MFS
  if (mfsPath) {
    await client.files.write(mfsPath, fileBuffer, {
      create: true,
      parents: true,
    });
  }

  return cid;
}
