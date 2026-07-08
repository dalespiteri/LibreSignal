type FileEntry = {
  size: number;
  owner: string;
};

type User = {
  capacity: number;
  used: number;
};

type BackupFile = {
  name: string;
  size: number;
};

export class CloudStorage {
  private readonly adminUserId = "admin";
  private files: Map<string, FileEntry>;
  private users: Map<string, User>;
  private backups: Map<string, BackupFile[]>;

  constructor() {
    this.files = new Map();
    this.users = new Map();
    this.backups = new Map();
  }

  addFile(name: string, size: number): boolean {
    if (this.files.has(name)) {
      return false;
    }
    this.files.set(name, { size, owner: this.adminUserId });
    return true;
  }

  getFileSize(name: string): string {
    const file = this.files.get(name);
    return file ? String(file.size) : "";
  }

  deleteFile(name: string): string {
    const file = this.files.get(name);
    if (!file) {
      return "";
    }

    this.files.delete(name);
    this.releaseCapacity(file.owner, file.size);
    return String(file.size);
  }

  getNLargest(prefix: string, n: number): string {
    return [...this.files.entries()]
      .filter(([name]) => name.startsWith(prefix))
      .sort(([nameA, fileA], [nameB, fileB]) => {
        const sizeDiff = fileB.size - fileA.size;
        return sizeDiff || nameA.localeCompare(nameB);
      })
      .slice(0, n)
      .map(([name, file]) => `${name}(${file.size})`)
      .join(", ");
  }

  addUser(userId: string, capacity: number): boolean {
    if (this.users.has(userId)) {
      return false;
    }
    this.users.set(userId, { capacity, used: 0 });
    return true;
  }

  addFileBy(userId: string, name: string, size: number): string {
    const user = this.users.get(userId);
    if (!user || this.files.has(name) || user.used + size > user.capacity) {
      return "";
    }

    this.files.set(name, { size, owner: userId });
    user.used += size;
    return String(user.capacity - user.used);
  }

  mergeUser(userId1: string, userId2: string): string {
    if (userId1 === userId2) {
      return "";
    }

    const user1 = this.users.get(userId1);
    const user2 = this.users.get(userId2);
    if (!user1 || !user2) {
      return "";
    }

    for (const file of this.files.values()) {
      if (file.owner === userId2) {
        file.owner = userId1;
      }
    }

    user1.capacity += user2.capacity;
    user1.used += user2.used;
    this.users.delete(userId2);
    this.backups.delete(userId2);
    return String(user1.capacity - user1.used);
  }

  backupUser(userId: string): string {
    if (!this.users.has(userId)) {
      return "";
    }

    const backup = [...this.files.entries()]
      .filter(([, file]) => file.owner === userId)
      .map(([name, file]) => ({ name, size: file.size }));

    this.backups.set(userId, backup);
    return String(backup.length);
  }

  restoreUser(userId: string): string {
    const user = this.users.get(userId);
    if (!user) {
      return "";
    }

    this.deleteFilesOwnedBy(userId);

    const backup = this.backups.get(userId) ?? [];
    let restored = 0;
    for (const file of backup) {
      if (!this.files.has(file.name)) {
        this.files.set(file.name, { size: file.size, owner: userId });
        user.used += file.size;
        restored += 1;
      }
    }

    return String(restored);
  }

  private releaseCapacity(userId: string, size: number): void {
    const user = this.users.get(userId);
    if (user) {
      user.used -= size;
    }
  }

  private deleteFilesOwnedBy(userId: string): void {
    for (const [name, file] of this.files) {
      if (file.owner === userId) {
        this.files.delete(name);
        this.releaseCapacity(userId, file.size);
      }
    }
  }
}
