process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
beforeAll(async () => {
    const companyResult = await db.query(`
        INSERT INTO companies (code, name, description) 
        VALUES ('faker', 'FakeTechCo', 'does fake stuff')`);
    testCompany = companyResult.rows[0]
})

let testInvoice;
beforeEach(async () => {
  const invoiceResult = await db.query(`
  INSERT INTO invoices (comp_code, amt)
  VALUES ('faker', 100)`)
  testInvoice = invoiceResult.rows[0]
})

afterEach(async () => {
  await db.query(`DELETE FROM invoices`)
})

afterAll(async () => {
  await db.end()
})

describe("GET /invoices", () => {
  test("Get a list of all invoices", async () => {
    const res = await request(app).get('/invoices')
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ invoices: [testInvoice] })
  })
})