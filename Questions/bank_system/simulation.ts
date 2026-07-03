type Payment = {
  id: string;
  amount: number;
  timestamp: number;
  processed: boolean;
}

type History = {
  change: number;
  timestamp: number;
}

type Account = {
  creationTime: number,
  balance: number;
  transfers: number;
  payments: Payment[];
  history: History[];
}

export class Simulation {
  private accounts: Map<string, Account>;

  constructor() {
    this.accounts = new Map();
  }

  private transactionID = 1;

  private readonly MILLISECONDS_IN_1_DAY = 24 * 60 * 60 * 1000;

  #processCashBack(timestamp: number, accountId: string): void {
    const account = this.accounts.get(accountId);
    if (!account) return;
    account.payments.forEach(payment => {
      const cashbackTimestamp = payment.timestamp + this.MILLISECONDS_IN_1_DAY;
      if (!payment.processed && timestamp >= cashbackTimestamp) {
        payment.processed = true;
        const cashback = Math.floor(payment.amount * 0.02);
        account.balance += cashback;
        account.history.push({ timestamp:cashbackTimestamp, change: cashback});
      }
    })
  }

  createAccount(timestamp: number, accountId: string): boolean {
    if (this.accounts.has(accountId)) {
      return false;
    }

    this.accounts.set(accountId, { creationTime: timestamp, balance: 0, transfers: 0, payments: [], history: [] });
    return true;
  }

  deposit(timestamp: number, accountId: string, amount: number): number | null {
    this.#processCashBack(timestamp, accountId);
    const account = this.accounts.get(accountId);
    if (!account) return null;
    account.balance += amount;
    account.history.push({timestamp, change: amount});
    return account.balance;
  }

  transfer(
    timestamp: number,
    sourceAccountId: string,
    targetAccountId: string,
    amount: number,
  ): number | null {
    this.#processCashBack(timestamp, sourceAccountId);
    this.#processCashBack(timestamp, targetAccountId);
    if (sourceAccountId === targetAccountId) return null;
    const sourceAccount = this.accounts.get(sourceAccountId);
    const targetAccount = this.accounts.get(targetAccountId);
    if (!sourceAccount || !targetAccount) return null;

    const sourceBalance = sourceAccount.balance;
    const targetBalance = targetAccount.balance;
    if (sourceBalance < amount) return null;

    const updatedSource = sourceBalance - amount;
    const updatedTarget = targetBalance + amount;
    sourceAccount.history.push({timestamp, change: -amount})
    targetAccount.history.push({timestamp, change: amount});
    sourceAccount.balance = updatedSource;
    targetAccount.balance = updatedTarget;
    sourceAccount.transfers += amount;
    return updatedSource
  }


  topSpenders(timestamp: number, n: number): string[] {
    const entries = [...this.accounts.entries()];
    entries.sort(([accAId, accA], [accBId, accB]) => {
      if (accA.transfers !== accB.transfers) {
        return accB.transfers - accA.transfers;
      }
      return accAId.localeCompare(accBId);
    });
    return entries.slice(0, n).map(([id, acc]) => `${id}(${acc.transfers})`);
  }

  pay(timestamp: number, accountId: string, amount: number): string | null {
    this.#processCashBack(timestamp, accountId);
    const account = this.accounts.get(accountId);
    if (!account) return null;
    if (account.balance < amount) return null;
    account.transfers += amount;
    account.balance -= amount;
    account.history.push({timestamp, change: (-amount)});
    const id = `payment${this.transactionID}`;
    this.transactionID++
    account.payments.push({ id, amount, timestamp, processed: false});
    return id;
  }

  getPaymentStatus(timestamp: number, accountId: string, payment: string): string | null {
    this.#processCashBack(timestamp, accountId);
    const account = this.accounts.get(accountId);
    if (!account) return null;
    const foundPayment = account.payments.find(p => p.id === payment);
    if (!foundPayment) return null;
    const status = timestamp < foundPayment.timestamp + this.MILLISECONDS_IN_1_DAY ? "IN_PROGRESS" : "CASHBACK_RECEIVED";
    return status;
  }

  mergeAccounts(timestamp: number, accountId1: string, accountId2: string): boolean {
    if (accountId1 === accountId2) return false;
    const account1 = this.accounts.get(accountId1);
    const account2 = this.accounts.get(accountId2);
    if (!account1 || !account2) return false;
    this.#processCashBack(timestamp, accountId1);
    this.#processCashBack(timestamp, accountId2);
    account1.balance += account2.balance;
    account1.transfers += account2.transfers;
    account1.payments = [...account1.payments, ...account2.payments];
    account1.history = [ ...account1.history, ...account2.history];
    this.accounts.delete(accountId2);
    return true;
  }

  getBalance(timestamp: number, accountId: string, timeAt: number): number | null {
    this.#processCashBack(timestamp, accountId);
    const account = this.accounts.get(accountId);
    if (!account) return null;
    if (account.creationTime > timeAt) return null;
    let currentBalance = 0;
    account.history.forEach(transaction => {
      if (transaction.timestamp <= timeAt) {
        currentBalance += transaction.change;
      }
    });
    return currentBalance;
  }
}
