type PaymentStatus = "IN_PROGRESS" | "CASHBACK_RECEIVED";
type Cashback = [timestamp: number, accountId: string, amount: number, paymentId: string];

class Account {
  accountId: string;
  balance: number;
  outgoing: number;
  payments: Map<string, PaymentStatus>;
  createdAt: number;
  balanceHistory: Array<[timestamp: number, balance: number]>;

  constructor(accountId: string, createdAt: number) {
    this.accountId = accountId;
    this.balance = 0;
    this.outgoing = 0;
    this.payments = new Map();
    this.createdAt = createdAt;
    this.balanceHistory = [[createdAt, 0]];
  }

  recordBalance(timestamp: number): void {
    this.balanceHistory.push([timestamp, this.balance]);
  }

  deposit(amount: number): number {
    this.balance += amount;
    return this.balance;
  }

  withdraw(amount: number): boolean {
    if (this.balance < amount) {
      return false;
    }
    this.balance -= amount;
    this.outgoing += amount;
    return true;
  }

  getBalanceAt(timeAt: number): number | null {
    if (timeAt < this.createdAt) {
      return null;
    }

    let result: number | null = null;
    for (const [timestamp, balance] of this.balanceHistory) {
      if (timestamp <= timeAt) {
        result = balance;
      } else {
        break;
      }
    }
    return result;
  }
}

export class Simulation {
  static readonly CASHBACK_DELAY = 24 * 60 * 60 * 1000;

  private accounts: Map<string, Account>;
  private paymentCounter: number;
  private pendingCashbacks: Cashback[];

  constructor() {
    this.accounts = new Map();
    this.paymentCounter = 0;
    this.pendingCashbacks = [];
  }

  createAccount(timestamp: number, accountId: string): boolean {
    this.processCashbacks(timestamp);
    if (this.accounts.has(accountId)) {
      return false;
    }
    this.accounts.set(accountId, new Account(accountId, timestamp));
    return true;
  }

  deposit(timestamp: number, accountId: string, amount: number): number | null {
    this.processCashbacks(timestamp);
    const account = this.accounts.get(accountId);
    if (!account) {
      return null;
    }
    const result = account.deposit(amount);
    account.recordBalance(timestamp);
    return result;
  }

  transfer(timestamp: number, sourceAccountId: string, targetAccountId: string, amount: number): number | null {
    this.processCashbacks(timestamp);
    if (sourceAccountId === targetAccountId) {
      return null;
    }

    const source = this.accounts.get(sourceAccountId);
    const target = this.accounts.get(targetAccountId);
    if (!source || !target || !source.withdraw(amount)) {
      return null;
    }

    target.deposit(amount);
    source.recordBalance(timestamp);
    target.recordBalance(timestamp);
    return source.balance;
  }

  topSpenders(timestamp: number, n: number): string[] {
    this.processCashbacks(timestamp);
    return [...this.accounts.keys()]
      .sort((a, b) => {
        const outgoingDiff = this.accounts.get(b)!.outgoing - this.accounts.get(a)!.outgoing;
        return outgoingDiff || a.localeCompare(b);
      })
      .slice(0, n)
      .map((accountId) => `${accountId}(${this.accounts.get(accountId)!.outgoing})`);
  }

  pay(timestamp: number, accountId: string, amount: number): string | null {
    this.processCashbacks(timestamp);
    const account = this.accounts.get(accountId);
    if (!account || !account.withdraw(amount)) {
      return null;
    }

    this.paymentCounter += 1;
    const paymentId = `payment${this.paymentCounter}`;
    account.payments.set(paymentId, "IN_PROGRESS");
    account.recordBalance(timestamp);

    const cashbackAmount = Math.floor((amount * 2) / 100);
    this.pendingCashbacks.push([
      timestamp + Simulation.CASHBACK_DELAY,
      accountId,
      cashbackAmount,
      paymentId,
    ]);

    return paymentId;
  }

  getPaymentStatus(timestamp: number, accountId: string, payment: string): string | null {
    this.processCashbacks(timestamp);
    const account = this.accounts.get(accountId);
    if (!account || !account.payments.has(payment)) {
      return null;
    }
    return account.payments.get(payment)!;
  }

  mergeAccounts(timestamp: number, accountId1: string, accountId2: string): boolean {
    this.processCashbacks(timestamp);
    if (accountId1 === accountId2) {
      return false;
    }

    const account1 = this.accounts.get(accountId1);
    const account2 = this.accounts.get(accountId2);
    if (!account1 || !account2) {
      return false;
    }

    account1.balance += account2.balance;
    account1.outgoing += account2.outgoing;
    for (const [paymentId, status] of account2.payments) {
      account1.payments.set(paymentId, status);
    }
    account1.balanceHistory.push(...account2.balanceHistory);
    account1.balanceHistory.sort((a, b) => a[0] - b[0]);
    account1.createdAt = Math.min(account1.createdAt, account2.createdAt);
    account1.recordBalance(timestamp);

    this.pendingCashbacks = this.pendingCashbacks.map(([cashbackTimestamp, accountId, amount, paymentId]) => [
      cashbackTimestamp,
      accountId === accountId2 ? accountId1 : accountId,
      amount,
      paymentId,
    ]);

    this.accounts.delete(accountId2);
    return true;
  }

  getBalance(timestamp: number, accountId: string, timeAt: number): number | null {
    this.processCashbacks(timestamp);
    const account = this.accounts.get(accountId);
    if (!account) {
      return null;
    }
    return account.getBalanceAt(timeAt);
  }

  private processCashbacks(timestamp: number): void {
    while (this.pendingCashbacks.length > 0 && this.pendingCashbacks[0][0] <= timestamp) {
      const [cashbackTimestamp, accountId, amount, paymentId] = this.pendingCashbacks.shift()!;
      const account = this.accounts.get(accountId);
      if (account) {
        account.deposit(amount);
        account.payments.set(paymentId, "CASHBACK_RECEIVED");
        account.recordBalance(cashbackTimestamp);
      }
    }
  }
}
