const assert = require("node:assert/strict");
const test = require("node:test");

const implementationFile =
  process.env.USE_SOLUTION === "1"
    ? "../../dist/Questions/in_memory_database/simulation_solution"
    : "../../dist/Questions/in_memory_database/simulation";
const { InMemoryDatabase } = require(implementationFile);

test("In-Memory Database Level 1 - set and get", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.set("user1", "name", "Alice"), "");
  assert.equal(db.set("user1", "age", "30"), "");
  assert.equal(db.get("user1", "name"), "Alice");
  assert.equal(db.get("user1", "age"), "30");
});

test("In-Memory Database Level 1 - set overwrite", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.set("user1", "name", "Alice"), "");
  assert.equal(db.set("user1", "name", "Bob"), "");
  assert.equal(db.get("user1", "name"), "Bob");
});

test("In-Memory Database Level 1 - get non-existent", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.get("user1", "field"), "");
  assert.equal(db.set("user1", "name", "Alice"), "");
  assert.equal(db.get("user1", "non_existent"), "");
});

test("In-Memory Database Level 1 - delete", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.set("user1", "name", "Alice"), "");
  assert.equal(db.delete("user1", "name"), "true");
  assert.equal(db.get("user1", "name"), "");
  assert.equal(db.delete("user1", "name"), "false");
  assert.equal(db.delete("non_existent", "field"), "false");
});

test("In-Memory Database Level 2 - scan", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.set("user1", "name", "Alice"), "");
  assert.equal(db.set("user1", "age", "30"), "");
  assert.equal(db.set("user1", "city", "NY"), "");
  assert.equal(db.set("user1", "abc", "123"), "");
  assert.equal(db.scan("user1"), "abc(123), age(30), city(NY), name(Alice)");
  assert.equal(db.scan("non_existent"), "");
});

test("In-Memory Database Level 2 - scan by prefix", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.set("user1", "name", "Alice"), "");
  assert.equal(db.set("user1", "age", "30"), "");
  assert.equal(db.set("user1", "city", "NY"), "");
  assert.equal(db.set("user1", "abc", "123"), "");
  assert.equal(db.scanByPrefix("user1", "a"), "abc(123), age(30)");
  assert.equal(db.scanByPrefix("user1", "n"), "name(Alice)");
  assert.equal(db.scanByPrefix("user1", "xyz"), "");
});

test("In-Memory Database Level 3 - set at and get at", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.setAt("user1", "name", "Alice", 100), "");
  assert.equal(db.setAt("user1", "age", "30", 101), "");
  assert.equal(db.getAt("user1", "name", 102), "Alice");
  assert.equal(db.getAt("user1", "age", 103), "30");
});

test("In-Memory Database Level 3 - get at non-existent", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.getAt("user2", "name", 100), "");
  assert.equal(db.getAt("user1", "non_existent", 101), "");
});

test("In-Memory Database Level 3 - ttl and get at", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.setAtWithTtl("user1", "name", "Alice", 100, 10), "");
  assert.equal(db.getAt("user1", "name", 105), "Alice");
  assert.equal(db.getAt("user1", "name", 110), "");
  assert.equal(db.getAt("user1", "name", 115), "");
});

test("In-Memory Database Level 3 - ttl overwrite without expiry", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.setAtWithTtl("user1", "name", "Alice", 100, 10), "");
  assert.equal(db.setAt("user1", "name", "Bob", 105), "");
  assert.equal(db.getAt("user1", "name", 110), "Bob");
  assert.equal(db.getAt("user1", "name", 140), "Bob");
});

test("In-Memory Database Level 3 - ttl overwrite with expiry", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.setAtWithTtl("user1", "name", "Alice", 100, 10), "");
  assert.equal(db.getAt("user1", "name", 105), "Alice");
  assert.equal(db.setAtWithTtl("user1", "name", "Bob", 106, 10), "");
  assert.equal(db.getAt("user1", "name", 110), "Bob");
  assert.equal(db.getAt("user1", "name", 117), "");
});

test("In-Memory Database Level 3 - ttl and get all", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.setAtWithTtl("user1", "name", "Alice", 100, 10), "");
  assert.equal(db.setAtWithTtl("user1", "age", "30", 101, 5), "");
  assert.equal(db.setAtWithTtl("user1", "city", "NY", 102, 15), "");
  assert.equal(db.get("user1", "name"), "Alice");
  assert.equal(db.get("user1", "age"), "30");
  assert.equal(db.get("user1", "city"), "NY");
});

test("In-Memory Database Level 3 - scan at", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.setAtWithTtl("user1", "name", "Alice", 100, 10), "");
  assert.equal(db.setAtWithTtl("user1", "age", "30", 101, 5), "");
  assert.equal(db.setAtWithTtl("user1", "city", "NY", 102, 15), "");
  assert.equal(db.scanAt("user1", 105), "age(30), city(NY), name(Alice)");
  assert.equal(db.scanAt("user1", 106), "city(NY), name(Alice)");
  assert.equal(db.scanAt("user1", 110), "city(NY)");
  assert.equal(db.scanAt("user1", 116), "city(NY)");
  assert.equal(db.scanAt("user1", 117), "");
});

test("In-Memory Database Level 3 - scan ignores expiry", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.setAtWithTtl("user1", "name", "Alice", 100, 10), "");
  assert.equal(db.setAtWithTtl("user1", "age", "30", 101, 5), "");
  assert.equal(db.setAtWithTtl("user1", "city", "NY", 102, 15), "");
  assert.equal(db.scan("user1"), "age(30), city(NY), name(Alice)");
});

test("In-Memory Database Level 3 - scan by prefix at", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.setAtWithTtl("user1", "name", "Alice", 100, 10), "");
  assert.equal(db.setAtWithTtl("user1", "age", "30", 101, 5), "");
  assert.equal(db.setAtWithTtl("user1", "city", "NY", 102, 15), "");
  assert.equal(db.setAtWithTtl("user1", "nationality", "free_country", 103, 5), "");
  assert.equal(db.scanByPrefixAt("user1", "a", 105), "age(30)");
  assert.equal(db.scanByPrefixAt("user1", "a", 106), "");
  assert.equal(db.scanByPrefixAt("user1", "n", 107), "name(Alice), nationality(free_country)");
  assert.equal(db.scanByPrefixAt("user1", "n", 109), "name(Alice)");
});

test("In-Memory Database Level 3 - scan by prefix ignores expiry", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.setAtWithTtl("user1", "name", "Alice", 100, 10), "");
  assert.equal(db.setAtWithTtl("user1", "age", "30", 101, 5), "");
  assert.equal(db.setAtWithTtl("user1", "city", "NY", 102, 15), "");
  assert.equal(db.setAtWithTtl("user1", "nationality", "free_country", 103, 5), "");
  assert.equal(db.scanByPrefix("user1", "a"), "age(30)");
  assert.equal(db.scanByPrefix("user1", "n"), "name(Alice), nationality(free_country)");
});

test("In-Memory Database Level 4 - backup returns count", () => {
  const db = new InMemoryDatabase();
  assert.equal(db.setAtWithTtl("A", "B", "C", 1, 10), "");
  assert.equal(db.backup(3), "1");
});

test("In-Memory Database Level 4 - backup excludes expired fields", () => {
  const db = new InMemoryDatabase();
  db.setAtWithTtl("A", "B", "C", 1, 10);
  assert.equal(db.backup(12), "0");
});

test("In-Memory Database Level 4 - restore from spec example", () => {
  const db = new InMemoryDatabase();
  db.setAtWithTtl("A", "B", "C", 1, 10);
  db.backup(3);
  db.setAt("A", "D", "E", 4);
  db.backup(5);
  db.deleteAt("A", "B", 8);
  db.backup(9);
  db.restore(10, 7);
  assert.equal(db.setAt("B", "C", "D", 11), "");
  assert.equal(db.scanAt("A", 15), "B(C), D(E)");
  assert.equal(db.scanAt("A", 16), "D(E)");
  assert.equal(db.scanAt("B", 17), "C(D)");
});
