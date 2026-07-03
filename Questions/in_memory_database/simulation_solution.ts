type Entry = {
  value: string;
  expiry: number | null;
};

type BackupEntry = {
  value: string;
  remainingLifespan: number | null;
};

export class InMemoryDatabase {
  private database: Map<string, Map<string, Entry>>;
  private backupTimestamps: number[];
  private backupStates: Array<Map<string, Map<string, BackupEntry>>>;

  constructor() {
    this.database = new Map();
    this.backupTimestamps = [];
    this.backupStates = [];
  }

  set(key: string, field: string, value: string): string {
    return this.setInternal(key, field, value, null);
  }

  get(key: string, field: string): string {
    const record = this.database.get(key);
    if (!record || !record.has(field)) {
      return "";
    }
    return record.get(field)!.value;
  }

  delete(key: string, field: string): string {
    const record = this.database.get(key);
    if (!record || !record.has(field)) {
      return "false";
    }
    record.delete(field);
    return "true";
  }

  scan(key: string): string {
    const record = this.database.get(key);
    if (!record) {
      return "";
    }
    return this.formatItems([...record.entries()].map(([field, entry]) => [field, entry.value]));
  }

  scanByPrefix(key: string, prefix: string): string {
    const record = this.database.get(key);
    if (!record) {
      return "";
    }
    return this.formatItems(
      [...record.entries()]
        .filter(([field]) => field.startsWith(prefix))
        .map(([field, entry]) => [field, entry.value]),
    );
  }

  setAt(key: string, field: string, value: string, timestamp: number): string {
    return this.setInternal(key, field, value, null);
  }

  setAtWithTtl(key: string, field: string, value: string, timestamp: number, ttl: number): string {
    return this.setInternal(key, field, value, timestamp + ttl);
  }

  deleteAt(key: string, field: string, timestamp: number): string {
    if (!this.isAlive(key, field, timestamp)) {
      return "false";
    }
    this.database.get(key)!.delete(field);
    return "true";
  }

  getAt(key: string, field: string, timestamp: number): string {
    if (!this.isAlive(key, field, timestamp)) {
      return "";
    }
    return this.database.get(key)!.get(field)!.value;
  }

  scanAt(key: string, timestamp: number): string {
    const record = this.database.get(key);
    if (!record) {
      return "";
    }
    return this.formatItems(
      [...record.entries()]
        .filter(([field]) => this.isAlive(key, field, timestamp))
        .map(([field, entry]) => [field, entry.value]),
    );
  }

  scanByPrefixAt(key: string, prefix: string, timestamp: number): string {
    const record = this.database.get(key);
    if (!record) {
      return "";
    }
    return this.formatItems(
      [...record.entries()]
        .filter(([field]) => field.startsWith(prefix) && this.isAlive(key, field, timestamp))
        .map(([field, entry]) => [field, entry.value]),
    );
  }

  backup(timestamp: number): string {
    const state = new Map<string, Map<string, BackupEntry>>();

    for (const [key, record] of this.database) {
      for (const [field, entry] of record) {
        if (this.isAlive(key, field, timestamp)) {
          if (!state.has(key)) {
            state.set(key, new Map());
          }
          const remainingLifespan = entry.expiry === null ? null : entry.expiry - timestamp;
          state.get(key)!.set(field, { value: entry.value, remainingLifespan });
        }
      }
    }

    this.backupTimestamps.push(timestamp);
    this.backupStates.push(state);
    return String(state.size);
  }

  restore(timestamp: number, timestampToRestore: number): string {
    let index = -1;
    for (let i = 0; i < this.backupTimestamps.length; i += 1) {
      if (this.backupTimestamps[i] <= timestampToRestore) {
        index = i;
      } else {
        break;
      }
    }

    const backupState = this.backupStates[index];
    this.database = new Map();

    for (const [key, record] of backupState) {
      for (const [field, entry] of record) {
        const expiry = entry.remainingLifespan === null ? null : timestamp + entry.remainingLifespan;
        this.setInternal(key, field, entry.value, expiry);
      }
    }

    return "";
  }

  private setInternal(key: string, field: string, value: string, expiry: number | null): string {
    if (!this.database.has(key)) {
      this.database.set(key, new Map());
    }
    this.database.get(key)!.set(field, { value, expiry });
    return "";
  }

  private isAlive(key: string, field: string, timestamp: number): boolean {
    const record = this.database.get(key);
    if (!record || !record.has(field)) {
      return false;
    }
    const { expiry } = record.get(field)!;
    return expiry === null || timestamp < expiry;
  }

  private formatItems(items: Array<[field: string, value: string]>): string {
    return items
      .sort(([fieldA], [fieldB]) => fieldA.localeCompare(fieldB))
      .map(([field, value]) => `${field}(${value})`)
      .join(", ");
  }
}
