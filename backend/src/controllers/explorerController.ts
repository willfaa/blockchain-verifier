import { Request, Response } from "express";
import { getBlockchainInfo, getCertificatesFromFabric } from "../fabric/client";

export const getExplorerStats = async (req: Request, res: Response) => {
  try {
    // For now, hardcode user acting as explorer (admin)
    // In production, use req.user.id
    const username = "admin";
    const role = "admin";

    // 1. Get Chain Info (Block Height, Current Hash)
    const chainInfo = await getBlockchainInfo(username, role);

    // 2. Get Ledger Assets (Count total certificates)
    const allCerts = await getCertificatesFromFabric();

    // Parse QCC buffer if possible, otherwise return raw buffer structure
    // Since we returned resultBuffer.toJSON(), it's { type: 'Buffer', data: [...] }
    // Real decoding needs 'fabric-protos', so we send raw for now or format it.

    res.json({
      ok: true,
      data: {
        chainInfo,
        totalTransactions: "Querying QSCC...", // Placeholder
        totalAssets: allCerts.length,
        ledger: allCerts,
      },
    });
  } catch (error: any) {
    console.error("Explorer Error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};
