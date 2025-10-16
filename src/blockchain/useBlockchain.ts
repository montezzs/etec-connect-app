import { useEffect, useState } from "react";
import { Blockchain, Transaction } from "./blockchain";

const blockchain = new Blockchain();

export const useBlockchain = () => {
  const [chain, setChain] = useState(blockchain.chain);
  const [transactions, setTransactions] = useState<Transaction[]>(
    blockchain.getAllTransactions()
  );

  useEffect(() => {
    setChain(blockchain.chain);
    setTransactions(blockchain.getAllTransactions());
  }, []);

  const addTransaction = (transaction: Transaction) => {
    blockchain.addTransaction(transaction);
    blockchain.minePendingTransactions();
    setChain([...blockchain.chain]);
    setTransactions(blockchain.getAllTransactions());
  };

  return { chain, transactions, addTransaction };
};
