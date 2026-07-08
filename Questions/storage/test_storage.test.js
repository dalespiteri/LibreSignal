const assert = require("node:assert/strict");
const test = require("node:test");

const implementationFile =
  process.env.USE_SOLUTION === "1"
    ? "../../dist/Questions/storage/simulation_solution"
    : "../../dist/Questions/storage/simulation";
const { CloudStorage } = require(implementationFile);

let callHistory = [];

function formatValue(value) {
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}

function expectCall(storage, methodName, args, expected) {
  const actual = storage[methodName](...args);
  const call = `${methodName}(${args.map(formatValue).join(", ")})`;
  const history = callHistory.length > 0
    ? `\nprevious calls:\n${callHistory.map((entry) => `  ${entry}`).join("\n")}\n`
    : "\nprevious calls: none\n";

  assert.equal(
    actual,
    expected,
    `${call}\nexpected: ${formatValue(expected)}\nactual:   ${formatValue(actual)}${history}`,
  );
  callHistory.push(`${call} -> ${formatValue(actual)}`);
}

function newStorage() {
  callHistory = [];
  return new CloudStorage();
}

test("Storage Level 1", () => {
  let storage = newStorage();
  expectCall(storage, "addFile", ["/dir1/dir2/file.txt", 10], true);
  expectCall(storage, "addFile", ["/dir1/dir2/file.txt", 5], false);
  expectCall(storage, "addFile", ["/another.file", 1], true);

  storage = newStorage();
  expectCall(storage, "getFileSize", ["/missing.file"], "");
  expectCall(storage, "addFile", ["/file.txt", 42], true);
  expectCall(storage, "getFileSize", ["/file.txt"], "42");

  storage = newStorage();
  expectCall(storage, "addFile", ["/dir1/dir2/file.txt", 10], true);
  expectCall(storage, "deleteFile", ["/not-existing.file"], "");
  expectCall(storage, "deleteFile", ["/dir1/dir2/file.txt"], "10");
  expectCall(storage, "getFileSize", ["/dir1/dir2/file.txt"], "");
});

test("Storage Level 2", () => {
  let storage = newStorage();
  expectCall(storage, "addFile", ["/dir/file1.txt", 5], true);
  expectCall(storage, "addFile", ["/dir/file2", 20], true);
  expectCall(storage, "addFile", ["/dir/deeper/file3.mov", 9], true);
  expectCall(storage, "getNLargest", ["/dir", 2], "/dir/file2(20), /dir/deeper/file3.mov(9)");
  expectCall(storage, "getNLargest", ["/dir/file", 3], "/dir/file2(20), /dir/file1.txt(5)");
  expectCall(storage, "getNLargest", ["/another_dir", 10], "");
  expectCall(storage, "addFile", ["/big_file.mp4", 20], true);
  expectCall(storage, "getNLargest", ["/", 2], "/big_file.mp4(20), /dir/file2(20)");

  storage = newStorage();
  expectCall(storage, "addFile", ["/a", 10], true);
  expectCall(storage, "addFile", ["/b", 20], true);
  expectCall(storage, "getNLargest", ["/", 5], "/b(20), /a(10)");
  expectCall(storage, "getNLargest", ["/", 0], "");

  storage = newStorage();
  expectCall(storage, "addFile", ["/z", 10], true);
  expectCall(storage, "addFile", ["/a", 10], true);
  expectCall(storage, "addFile", ["/m", 12], true);
  expectCall(storage, "getNLargest", ["/", 3], "/m(12), /a(10), /z(10)");
});

test("Storage Level 3", () => {
  let storage = newStorage();
  expectCall(storage, "addUser", ["user1", 200], true);
  expectCall(storage, "addUser", ["user1", 100], false);
  expectCall(storage, "addUser", ["user2", 0], true);

  storage = newStorage();
  expectCall(storage, "addUser", ["user1", 200], true);
  expectCall(storage, "addFileBy", ["missing", "/file", 10], "");
  expectCall(storage, "addFileBy", ["user1", "/dir/file.med", 50], "150");
  expectCall(storage, "addFileBy", ["user1", "/big.blob", 140], "10");
  expectCall(storage, "addFileBy", ["user1", "/file-small", 20], "");
  expectCall(storage, "addFile", ["/dir/admin_file", 300], true);
  expectCall(storage, "addFileBy", ["user1", "/dir/admin_file", 1], "");

  storage = newStorage();
  expectCall(storage, "addUser", ["user1", 200], true);
  expectCall(storage, "addFileBy", ["user1", "/dir/file.med", 50], "150");
  expectCall(storage, "addFileBy", ["user1", "/big.blob", 140], "10");
  expectCall(storage, "addFile", ["/dir/admin_file", 300], true);
  expectCall(storage, "addUser", ["user2", 110], true);
  expectCall(storage, "addFileBy", ["user2", "/dir/file.med", 45], "");
  expectCall(storage, "addFileBy", ["user2", "/new_file", 50], "60");
  expectCall(storage, "mergeUser", ["user1", "user2"], "70");
  expectCall(storage, "addFileBy", ["user2", "/after_merge", 1], "");
  expectCall(storage, "getFileSize", ["/new_file"], "50");

  storage = newStorage();
  expectCall(storage, "addUser", ["user1", 100], true);
  expectCall(storage, "mergeUser", ["user1", "user1"], "");
  expectCall(storage, "mergeUser", ["user1", "missing"], "");
  expectCall(storage, "mergeUser", ["missing", "user1"], "");

  storage = newStorage();
  expectCall(storage, "addUser", ["user1", 100], true);
  expectCall(storage, "addFileBy", ["user1", "/file1", 90], "10");
  expectCall(storage, "deleteFile", ["/file1"], "90");
  expectCall(storage, "addFileBy", ["user1", "/file2", 100], "0");
});

test("Storage Level 4", () => {
  let storage = newStorage();
  expectCall(storage, "backupUser", ["missing"], "");
  expectCall(storage, "restoreUser", ["missing"], "");

  storage = newStorage();
  expectCall(storage, "addUser", ["user", 100], true);
  expectCall(storage, "addFileBy", ["user", "/dir/file1", 50], "50");
  expectCall(storage, "addFileBy", ["user", "/file2.txt", 30], "20");
  expectCall(storage, "restoreUser", ["user"], "0");
  expectCall(storage, "getFileSize", ["/dir/file1"], "");
  expectCall(storage, "getFileSize", ["/file2.txt"], "");
  expectCall(storage, "addFileBy", ["user", "/after_restore", 100], "0");

  storage = newStorage();
  expectCall(storage, "addUser", ["user", 100], true);
  expectCall(storage, "addFileBy", ["user", "/file3.mp4", 60], "40");
  expectCall(storage, "addFileBy", ["user", "/file4.txt", 10], "30");
  expectCall(storage, "backupUser", ["user"], "2");
  expectCall(storage, "deleteFile", ["/file3.mp4"], "60");
  expectCall(storage, "deleteFile", ["/file4.txt"], "10");
  expectCall(storage, "addFileBy", ["user", "/dir/file5.new", 20], "80");
  expectCall(storage, "restoreUser", ["user"], "2");
  expectCall(storage, "getFileSize", ["/file3.mp4"], "60");
  expectCall(storage, "getFileSize", ["/file4.txt"], "10");
  expectCall(storage, "getFileSize", ["/dir/file5.new"], "");

  storage = newStorage();
  expectCall(storage, "addUser", ["user1", 100], true);
  expectCall(storage, "addUser", ["user2", 100], true);
  expectCall(storage, "addFileBy", ["user1", "/shared", 40], "60");
  expectCall(storage, "addFileBy", ["user1", "/only-user1", 20], "40");
  expectCall(storage, "backupUser", ["user1"], "2");
  expectCall(storage, "deleteFile", ["/shared"], "40");
  expectCall(storage, "addFileBy", ["user2", "/shared", 50], "50");
  expectCall(storage, "addFileBy", ["user1", "/temporary", 10], "70");
  expectCall(storage, "restoreUser", ["user1"], "1");
  expectCall(storage, "getFileSize", ["/shared"], "50");
  expectCall(storage, "getFileSize", ["/only-user1"], "20");
  expectCall(storage, "getFileSize", ["/temporary"], "");

  storage = newStorage();
  expectCall(storage, "addUser", ["user1", 100], true);
  expectCall(storage, "addUser", ["user2", 100], true);
  expectCall(storage, "addFileBy", ["user2", "/old", 20], "80");
  expectCall(storage, "backupUser", ["user2"], "1");
  expectCall(storage, "deleteFile", ["/old"], "20");
  expectCall(storage, "backupUser", ["user2"], "0");
  expectCall(storage, "addFileBy", ["user2", "/new", 30], "70");
  expectCall(storage, "mergeUser", ["user1", "user2"], "170");
  expectCall(storage, "restoreUser", ["user2"], "");
  expectCall(storage, "restoreUser", ["user1"], "0");
  expectCall(storage, "getFileSize", ["/new"], "");
});
