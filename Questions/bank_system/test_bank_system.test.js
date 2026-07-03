const assert = require("node:assert/strict");
const test = require("node:test");

const implementationFile =
  process.env.USE_SOLUTION === "1"
    ? "../../dist/Questions/bank_system/simulation_solution"
    : "../../dist/Questions/bank_system/simulation";
const { Simulation } = require(implementationFile);

test("Bank System Level 1 - create account", () => {
  const simulation = new Simulation();
  assert.equal(simulation.createAccount(1, "acc1"), true);
  assert.equal(simulation.createAccount(2, "acc1"), false);
  assert.equal(simulation.createAccount(3, "acc2"), true);
});

test("Bank System Level 1 - deposit", () => {
  const simulation = new Simulation();
  simulation.createAccount(1, "acc1");
  assert.equal(simulation.deposit(2, "acc1", 500), 500);
  assert.equal(simulation.deposit(3, "acc1", 300), 800);
  assert.equal(simulation.deposit(4, "non_existent", 100), null);
});

test("Bank System Level 1 - transfer", () => {
  const simulation = new Simulation();
  assert.equal(simulation.createAccount(1, "acc1"), true);
  assert.equal(simulation.createAccount(2, "acc2"), true);
  assert.equal(simulation.deposit(3, "acc1", 1000), 1000);
  assert.equal(simulation.transfer(4, "acc1", "acc2", 300), 700);
  assert.equal(simulation.transfer(5, "acc1", "acc2", 800), null);
  assert.equal(simulation.transfer(6, "acc1", "non_existent", 100), null);
  assert.equal(simulation.transfer(7, "acc1", "acc1", 100), null);
});

test("Bank System Level 1 - example 1", () => {
  const simulation = new Simulation();
  assert.equal(simulation.createAccount(1, "account1"), true);
  assert.equal(simulation.createAccount(2, "account1"), false);
  assert.equal(simulation.createAccount(3, "account2"), true);
  assert.equal(simulation.deposit(4, "non_existent", 100), null);
  assert.equal(simulation.deposit(5, "account1", 2700), 2700);
  assert.equal(simulation.transfer(6, "account1", "account2", 2701), null);
  assert.equal(simulation.transfer(7, "account1", "account2", 200), 2500);
});

test("Bank System Level 1 - example 2", () => {
  const simulation = new Simulation();
  assert.equal(simulation.createAccount(1, "A"), true);
  assert.equal(simulation.createAccount(2, "B"), true);
  assert.equal(simulation.deposit(3, "A", 500), 500);
  assert.equal(simulation.transfer(4, "A", "B", 300), 200);
  assert.equal(simulation.deposit(5, "B", 200), 500);
  assert.equal(simulation.transfer(6, "B", "A", 600), null);
  assert.equal(simulation.transfer(7, "B", "A", 400), 100);
});

test("Bank System Level 1 - example 3", () => {
  const simulation = new Simulation();
  assert.equal(simulation.createAccount(1, "X"), true);
  assert.equal(simulation.deposit(2, "X", 1000), 1000);
  assert.equal(simulation.createAccount(3, "Y"), true);
  assert.equal(simulation.transfer(4, "X", "Y", 500), 500);
  assert.equal(simulation.transfer(5, "Y", "X", 600), null);
  assert.equal(simulation.deposit(6, "Y", 300), 800);
  assert.equal(simulation.transfer(7, "Y", "X", 400), 400);
});

test("Bank System Level 2 - top spenders empty", () => {
  const simulation = new Simulation();
  assert.deepEqual(simulation.topSpenders(1, 0), []);
  assert.deepEqual(simulation.topSpenders(2, 5), []);
});

test("Bank System Level 2 - single account less than n", () => {
  const simulation = new Simulation();
  simulation.createAccount(1, "acc1");
  simulation.deposit(2, "acc1", 1000);
  simulation.createAccount(3, "acc2");
  simulation.transfer(4, "acc1", "acc2", 500);
  assert.deepEqual(simulation.topSpenders(5, 1), ["acc1(500)"]);
});

test("Bank System Level 2 - tie sorting", () => {
  const simulation = new Simulation();
  simulation.createAccount(1, "acc1");
  simulation.createAccount(2, "acc2");
  simulation.createAccount(3, "acc3");
  simulation.deposit(4, "acc1", 1000);
  simulation.deposit(5, "acc2", 1500);
  simulation.deposit(6, "acc3", 1200);
  simulation.transfer(8, "acc2", "acc3", 500);
  simulation.transfer(7, "acc1", "acc2", 500);
  simulation.transfer(9, "acc3", "acc1", 300);
  assert.deepEqual(simulation.topSpenders(10, 3), ["acc1(500)", "acc2(500)", "acc3(300)"]);
});

test("Bank System Level 3 - pay no account id", () => {
  const simulation = new Simulation();
  assert.equal(simulation.pay(1, "non_existent", 100), null);
  assert.equal(simulation.getPaymentStatus(2, "non_existent", "payment1"), null);
});

test("Bank System Level 3 - pay insufficient funds", () => {
  const simulation = new Simulation();
  simulation.createAccount(1, "acc1");
  simulation.deposit(2, "acc1", 100);
  assert.equal(simulation.pay(3, "acc1", 200), null);
});

test("Bank System Level 3 - pay top spenders", () => {
  const simulation = new Simulation();
  simulation.createAccount(1, "acc1");
  simulation.deposit(2, "acc1", 1000);
  assert.equal(simulation.pay(3, "acc1", 500), "payment1");
  assert.equal(simulation.pay(4, "acc1", 300), "payment2");
  simulation.createAccount(5, "acc2");
  simulation.deposit(6, "acc2", 800);
  simulation.transfer(7, "acc2", "acc1", 200);
  assert.deepEqual(simulation.topSpenders(5, 2), ["acc1(800)", "acc2(200)"]);
});

test("Bank System Level 3 - payment status missing account", () => {
  const simulation = new Simulation();
  assert.equal(simulation.getPaymentStatus(1, "non_existent", "payment1"), null);
});

test("Bank System Level 3 - payment status missing payment", () => {
  const simulation = new Simulation();
  simulation.createAccount(1, "acc1");
  assert.equal(simulation.getPaymentStatus(2, "acc1", "payment1"), null);
});

test("Bank System Level 3 - payment belongs to a different account", () => {
  const simulation = new Simulation();
  simulation.createAccount(1, "acc1");
  simulation.deposit(2, "acc1", 1000);
  const paymentId = simulation.pay(3, "acc1", 500);
  assert.equal(paymentId, "payment1");
  simulation.createAccount(4, "acc2");
  assert.equal(simulation.getPaymentStatus(4, "acc2", paymentId), null);
});

test("Bank System Level 3 - cashback and status", () => {
  const simulation = new Simulation();
  simulation.createAccount(1, "acc1");
  simulation.deposit(2, "acc1", 1000);
  const paymentId = simulation.pay(3, "acc1", 500);
  assert.equal(paymentId, "payment1");
  assert.equal(simulation.getPaymentStatus(4, "acc1", paymentId), "IN_PROGRESS");
  assert.equal(simulation.getPaymentStatus(26 * 3600, "acc1", paymentId), "IN_PROGRESS");
  assert.equal(
    simulation.getPaymentStatus(24 * 60 * 60 * 1000 + 3, "acc1", paymentId),
    "CASHBACK_RECEIVED",
  );
  assert.equal(simulation.deposit(28 * 60 * 60 * 1000, "acc1", 0), 510);
});

test("Bank System Level 4 - first account does not exist", () => {
  const simulation = new Simulation();
  simulation.createAccount(1, "acc2");
  assert.equal(simulation.mergeAccounts(2, "acc1", "acc2"), false);
});

test("Bank System Level 4 - second account does not exist", () => {
  const simulation = new Simulation();
  simulation.createAccount(1, "acc1");
  assert.equal(simulation.mergeAccounts(2, "acc1", "acc2"), false);
});

test("Bank System Level 4 - merge cashback", () => {
  const simulation = new Simulation();
  simulation.createAccount(1, "acc1");
  simulation.deposit(2, "acc1", 1000);
  const paymentId = simulation.pay(3, "acc1", 500);
  assert.notEqual(paymentId, null);
  simulation.createAccount(4, "acc2");
  simulation.mergeAccounts(5, "acc2", "acc1");
  assert.equal(simulation.getPaymentStatus(6, "acc2", paymentId), "IN_PROGRESS");
  assert.equal(
    simulation.getPaymentStatus(24 * 60 * 60 * 1000 + 3, "acc2", paymentId),
    "CASHBACK_RECEIVED",
  );
  assert.equal(simulation.deposit(24 * 60 * 60 * 1000 + 5, "acc2", 0), 510);
});

test("Bank System Level 4 - merge top spender", () => {
  const simulation = new Simulation();
  simulation.createAccount(1, "acc1");
  simulation.deposit(2, "acc1", 1000);
  simulation.pay(3, "acc1", 500);
  simulation.createAccount(4, "acc2");
  simulation.deposit(5, "acc2", 2000);
  simulation.pay(6, "acc2", 800);
  simulation.mergeAccounts(7, "acc1", "acc2");
  assert.deepEqual(simulation.topSpenders(8, 1), ["acc1(1300)"]);
});

test("Bank System Level 4 - historical cashback balance", () => {
  const simulation = new Simulation();
  simulation.createAccount(1, "acc1");
  simulation.deposit(2, "acc1", 1000);
  simulation.pay(3, "acc1", 300);
  assert.equal(simulation.getBalance(4, "acc1", 3), 700);
  assert.equal(simulation.getBalance(24 * 60 * 60 * 1000 + 5, "acc1", 24 * 60 * 60 * 1000 + 2), 700);
  assert.equal(simulation.getBalance(24 * 60 * 60 * 1000 + 5, "acc1", 24 * 60 * 60 * 1000 + 3), 706);
});
