const ADMIN = "admin";
interface IBackupItem {
  file: string;
  size: number;
}
interface IFileDetails {
  owner: string;
  size: number;
}
interface IUser {
  capacity: number;
  usedSpace: number;
  files: string[];
}

export class CloudStorage {
  private cloudStorage: Map<string, IFileDetails>;
  private users: Map<string, IUser>;
  private backups: Map<string, IBackupItem[]>;
  constructor() {
    this.cloudStorage = new Map();
    this.users = new Map().set(ADMIN, { capacity: Infinity, usedSpace: 0 });
    this.backups = new Map();
  }
  // Level 1 operations
  addFile(name: string, size: number, owner = ADMIN): boolean {
    if (this.cloudStorage.has(name)) return false;
    this.cloudStorage.set(name, {size, owner});
    return true;
  }

  getFileSize(name: string): string {
    const file = this.cloudStorage.get(name);
    if (file?.size !== undefined) {
      return file.size.toString();
    } else {
      return "";
    }
  }

  deleteFile(name: string): string {
    if (this.cloudStorage.has(name)) {
      const file = this.cloudStorage.get(name);
      if (file?.size !== undefined) {
        // delete the file
        this.cloudStorage.delete(name);
        // update the user if not admin
        if (file.owner !== ADMIN) {
          const user = this.users.get(file.owner);
          if (user?.usedSpace) {
            user.usedSpace -= file.size;
            user.files = [...user.files].filter(file => file !== name);
          }
        }
        return file.size.toString();
      }
    }
    return "";
  }

  // Level 2 operations
  getNLargest(prefix: string, n: number): string {
    const [...items] = this.cloudStorage.entries();
    const filteredItems = items
    .filter(([key]) => key.startsWith(prefix))
    .sort(([keyA, {size: sizeA}], [keyB, {size: sizeB}]) => {
      if (sizeA === sizeB) {
        return keyA.localeCompare(keyB);
      } else {
        return sizeB - sizeA;
      }
    })
    .slice(0, n);
    let res = [];
    for (const [key, {size}] of filteredItems) {
      res.push(`${key}(${size})`);
    }
    return res.join(", ");
  }

  // Level 3 operations
  addUser(userId: string, capacity: number): boolean {
    if (this.users.has(userId)) return false;
    this.users.set(userId, { capacity, usedSpace: 0, files: [] });
    return true;
  }

  addFileBy(userId: string, name: string, size: number): string {
    const user = this.users.get(userId);
    if (user) {
      const { capacity, usedSpace } = user;
      if (usedSpace + size <= capacity) {
        const isSuccess = this.addFile(name, size, userId);
        if (isSuccess) {
          user.usedSpace += size;
          user.files.push(name);
          return `${capacity - user.usedSpace}`;
        }
      }
    }
    return "";
  }

  mergeUser(userId1: string, userId2: string): string {
    if (userId1 === userId2) return "";
    const user1 = this.users.get(userId1);
    const user2 = this.users.get(userId2);
    if (!user1 || !user2) return "";
    user1.capacity += user2.capacity;
    user1.usedSpace += user2.usedSpace;
    user1.files = [...user1.files, ...user2.files];
    this.users.delete(userId2);
    return `${user1.capacity - user1.usedSpace}`;
  }

  // Level 4 operations
  backupUser(userId: string): string {
    if (!this.users.has(userId)) return "";
    const user = this.users.get(userId);
    if (user) {
      const backupPayload: IBackupItem[] = [];
      for (const file of user.files) {
        const fileDetail = this.cloudStorage.get(file);
        const size = fileDetail?.size;
        if (size) {
          backupPayload.push({ file, size: fileDetail?.size})
        }
      }
      this.backups.set(userId, backupPayload);
      return backupPayload.length.toString();
    }
    return "";
  }

  restoreUser(userId: string): string {
    if (!this.users.has(userId)) return "";
    // if they have no backups, delete all their files
    const user = this.users.get(userId);
    let restorationCount = 0;
    if (!this.backups.has(userId)) {
      if (user?.files) {
        for (const file of user.files) {
          this.cloudStorage.delete(file);
        }
        user.files = [];
        user.usedSpace = 0;
      }
    }
    // if they have a backup, restore it
    else {
      // go through their current files and delete them
      if (user?.files) {
        for (const file of user.files) {
          this.cloudStorage.delete(file);
        }
      }
      const backups = this.backups.get(userId);
      if (backups && user) {
        user.files = [];
        user.usedSpace = 0;
        for (const backup of backups) {
          if (!this.cloudStorage.has(backup.file)) {
            this.cloudStorage.set(backup.file, { owner: userId, size: backup.size});
            user.files.push(backup.file);
            user.usedSpace += backup.size;
            restorationCount++;
          }
        }
      }
    }
    return restorationCount.toString();
  }
}
