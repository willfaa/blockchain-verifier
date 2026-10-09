import { WalletStore, Wallet } from "fabric-network";
import { db } from "../config/db";

/**
 * Custom Fabric WalletStore implementation backed by PostgreSQL via Prisma.
 * This ensures that cryptographic identities (X.509 certs & private keys)
 * are stored securely in the database rather than polluting the local filesystem/git.
 */
export class PrismaWalletStore implements WalletStore {
  private namespace: string;

  constructor(namespace: string = "default") {
    this.namespace = namespace.toLowerCase().trim();
  }

  async get(label: string): Promise<Buffer | undefined> {
    try {
      const record = await (db as any).fabricWallet.findUnique({
        where: {
          namespace_label: {
            namespace: this.namespace,
            label: label,
          },
        },
      });
      if (!record || !record.data) return undefined;
      return Buffer.from(record.data);
    } catch (err: any) {
      console.warn(`[PrismaWalletStore] Error getting identity "${label}" (${this.namespace}):`, err.message);
      return undefined;
    }
  }

  async list(): Promise<string[]> {
    try {
      const records = await (db as any).fabricWallet.findMany({
        where: { namespace: this.namespace },
        select: { label: true },
      });
      return records.map((r: { label: string }) => r.label);
    } catch (err: any) {
      console.warn(`[PrismaWalletStore] Error listing identities (${this.namespace}):`, err.message);
      return [];
    }
  }

  async put(label: string, data: Buffer): Promise<void> {
    try {
      await (db as any).fabricWallet.upsert({
        where: {
          namespace_label: {
            namespace: this.namespace,
            label: label,
          },
        },
        update: {
          data: Buffer.from(data),
        },
        create: {
          namespace: this.namespace,
          label: label,
          data: Buffer.from(data),
        },
      });
    } catch (err: any) {
      console.error(`[PrismaWalletStore] Error putting identity "${label}" (${this.namespace}):`, err.message);
      throw err;
    }
  }

  async remove(label: string): Promise<void> {
    try {
      await (db as any).fabricWallet.deleteMany({
        where: {
          namespace: this.namespace,
          label: label,
        },
      });
    } catch (err: any) {
      console.warn(`[PrismaWalletStore] Error removing identity "${label}" (${this.namespace}):`, err.message);
    }
  }
}

/**
 * Factory helper to get or create a database-backed Fabric Wallet instance.
 */
export function createPrismaWallet(namespace: string = "default"): Wallet {
  return new Wallet(new PrismaWalletStore(namespace));
}
