
type FieldEntry = {
  value: string;
  ttl?: number;
  expiresAt?: number;
  remainingTtl?: number;
}

type Database = Map<string, Map<string, FieldEntry>>;

type DatabaseBackup = Map<number, Database>;

export class InMemoryDatabase {
  imdb: Database;
  imdbBackups: DatabaseBackup;
  constructor() {
    this.imdb = new Map();
    this.imdbBackups = new Map();
  }

  // Level 1 operations
  set(key: string, field: string, value: string): string {
    let record = this.imdb.get(key);
    if (!record) {
      record = new Map();
      this.imdb.set(key, record);
    }
    record.set(field, { value });
    return '';
  }

  get(key: string, field: string): string {
    const res = this.imdb.get(key)?.get(field);
    return res?.value ?? '';
  }

  delete(key: string, field: string): string {
    const record = this.imdb.get(key);
    if (!record || !record.has(field)) {
      return 'false';
    }
    record.delete(field);
    return 'true';
  }

  // Level 2 operations
  scan(key: string): string {
    const record = this.imdb.get(key);
    if (!record) return '';
    const entries = [...record.entries()];
    entries.sort(([fieldA], [fieldB]) => fieldA.localeCompare(fieldB));
    const resArray = [];
    for (const [field, {value}] of entries) {
      resArray.push(`${field}(${value})`);
    }
    const resString = resArray.join(", ");
    return resString;
  }

  scanByPrefix(key: string, prefix: string): string {
    const record = this.imdb.get(key);
    if (!record) return '';
    const fieldsArray = [...record]
      .filter(([field]) => field.startsWith(prefix))
      .sort(([fieldA], [fieldB]) => fieldA.localeCompare(fieldB));
    let resArray = [];
    for (const [field, {value}] of fieldsArray) {
      resArray.push(`${field}(${value})`);
    }
    return resArray.join(", ");
  }

  // Level 3 operations
  setAt(key: string, field: string, value: string, timestamp: number): string {
    let record = this.imdb.get(key);
    if (!record) {
      record = new Map();
      this.imdb.set(key, record);
    }
    record.set(field, { value });
    return '';
  }

  setAtWithTtl(key: string, field: string, value: string, timestamp: number, ttl: number): string {
    let record = this.imdb.get(key);
    if (!record) {
      record = new Map();
      this.imdb.set(key, record);
    }
    record.set(field, { value, ttl, expiresAt: timestamp + ttl });
    return '';
  }

  deleteAt(key: string, field: string, timestamp: number): string {
    const record = this.imdb.get(key);
    if (!record || !record.has(field)) {
      return 'false';
    }
    const entry = record.get(field);
    if (!entry?.expiresAt) {
      record.delete(field);
      return 'true';
    }
    if (entry.expiresAt > timestamp) {
      record.delete(field);
      return 'true';
    }
    return 'false';
  }

  getAt(key: string, field: string, timestamp: number): string {
    const foundField = this.imdb.get(key)?.get(field);
    if (!foundField) return '';
    if (!foundField.expiresAt) {
      return foundField.value;
    } else {
      return foundField.expiresAt > timestamp ? foundField.value : '';
    }
  }

  scanAt(key: string, timestamp: number): string {
    const record = this.imdb.get(key);
    if (!record) return '';
    const entries = [...record.entries()]
    .filter(([_, {expiresAt}]) => {
      if (expiresAt) {
        return expiresAt > timestamp;
      }
      return true;
    })
    .sort(([fieldA], [fieldB]) => fieldA.localeCompare(fieldB));
    const resArray = [];
    for (const [field, {value}] of entries) {
      resArray.push(`${field}(${value})`);
    }
    const resString = resArray.join(", ");
    return resString;
  }

  scanByPrefixAt(key: string, prefix: string, timestamp: number): string {
    const record = this.imdb.get(key);
    if (!record) return '';
    const entries = [...record.entries()]
    .filter(([field]) => field.startsWith(prefix))
    .filter(([_, {expiresAt}]) => {
      if (expiresAt) {
        return expiresAt > timestamp;
      }
      return true;
    })
    .sort(([fieldA], [fieldB]) => fieldA.localeCompare(fieldB));
    const resArray = [];
    for (const [field, {value}] of entries) {
      resArray.push(`${field}(${value})`);
    }
    const resString = resArray.join(", ");
    return resString;
  }

  // Level 4 operations
  backup(timestamp: number): string {
    const backup = structuredClone(this.imdb);
    const keys = [...backup.entries()];
    let count = 0;
    for (const [key, field] of keys) {
      let hasUnexpired = false;
      for (const [fieldKey, entry] of field) {
        if (!entry.expiresAt) {
          hasUnexpired = true;
        } else if (entry.expiresAt > timestamp) {
          backup.get(key)?.set(fieldKey, {...entry, remainingTtl: entry.expiresAt - timestamp})
          hasUnexpired = true;
        } else {
          backup.get(key)?.delete(fieldKey);
        };
      };
      if (hasUnexpired) {
        count++
      } else {
        backup.delete(key);
      }
    }
    this.imdbBackups.set(timestamp, backup);
    return count.toString();
  }

  #reassignTtl(db: Database, timestamp: number): void {
    for (const [_, field] of db.entries()) {
      for (const [_, value] of field.entries()) {
        if (value.remainingTtl) {
          value.expiresAt = timestamp + value.remainingTtl;
        }
      }
    }
  }

  restore(timestamp: number, timestampToRestore: number): string {
    const sortedBackups = [...this.imdbBackups.entries()].sort(([keyA], [keyB]) => keyA - keyB);
    let left = 0;
    let right = sortedBackups.length - 1;
    let [optimalBackupTimestamp] = sortedBackups[left];
    while (left <= right) {
      let middle = Math.floor((left + right) / 2);
      if (sortedBackups[middle][0] > timestampToRestore) {
        right = middle - 1;
      } else {
        left = middle + 1;
      }
      optimalBackupTimestamp = sortedBackups[left - 1][0];
    }
    const optimalBackup = this.imdbBackups.get(optimalBackupTimestamp);
    if (optimalBackup) {
      this.#reassignTtl(optimalBackup, timestamp);
      this.imdb = optimalBackup;
    }
    return '';
  }
}
