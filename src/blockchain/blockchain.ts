import CryptoJS from "crypto-js";

export interface Transaction {
  id: string;
  type: "send" | "receive";
  amount: number;
  description: string;
  timestamp: string;
  category?: string;
  date?: string;
}

export class Block {
  index: number;
  timestamp: string;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;

  constructor(index: number, transactions: Transaction[], previousHash = "") {
    this.index = index;
    this.timestamp = new Date().toISOString();
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    return CryptoJS.SHA256(
      this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.nonce
    ).toString();
  }

  mineBlock(difficulty: number) {
    while (!this.hash.startsWith("0".repeat(difficulty))) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
}

export class Blockchain {
  chain: Block[];
  difficulty: number;
  pendingTransactions: Transaction[];

  constructor() {
    this.chain = this.loadChain();
    this.difficulty = 2;
    this.pendingTransactions = [];
  }

  createGenesisBlock(): Block {
    return new Block(
      0,
      [
        {
          id: "genesis",
          type: "receive",
          amount: 0,
          description: "Genesis Block",
          timestamp: new Date().toISOString(),
        },
      ],
      "0"
    );
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction: Transaction) {
    this.pendingTransactions.push(transaction);
  }

  minePendingTransactions() {
    const block = new Block(
      this.chain.length,
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);
    this.chain.push(block);
    this.pendingTransactions = [];
    this.saveChain();
  }

  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const prev = this.chain[i - 1];
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== prev.hash) return false;
    }
    return true;
  }

  saveChain() {
    localStorage.setItem("pix_blockchain", JSON.stringify(this.chain));
  }

  loadChain(): Block[] {
    const stored = localStorage.getItem("pix_blockchain");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((b: any) =>
          Object.assign(new Block(b.index, b.transactions, b.previousHash), b)
        );
      } catch {
        return [this.createGenesisBlock()];
      }
    }
    return [this.createGenesisBlock()];
  }

  getAllTransactions(): Transaction[] {
    return this.chain.flatMap((block) =>
      block.transactions.filter((t) => t.id !== "genesis")
    );
  }
}
