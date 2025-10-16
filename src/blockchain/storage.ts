import { Blockchain } from "./blockchain";

const STORAGE_KEY = "etecbank_blockchain";

export function saveBlockchain(blockchain: Blockchain): void {
  try {
    const data = JSON.stringify(blockchain);
    localStorage.setItem(STORAGE_KEY, data);
  } catch (error) {
    console.error("Erro ao salvar blockchain:", error);
  }
}

export function loadBlockchain(): Blockchain | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    const blockchain = Object.assign(new Blockchain(), parsed);
    return blockchain;
  } catch (error) {
    console.error("Erro ao carregar blockchain:", error);
    return null;
  }
}

export function clearBlockchain(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Erro ao limpar blockchain:", error);
  }
}
