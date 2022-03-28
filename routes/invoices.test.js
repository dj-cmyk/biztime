process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

const mockDateObject = new Date("2021-02-26T22:42:16.652Z");
const spy = jest
    .spyOn(global, "Date")
    .mockImplementation(() => mockDateObject);

let testCompany;
beforeAll(async () => {
    const companyResult = await db.query(`
        INSERT INTO companies (code, name, description) 
        VALUES ('test', 'TestCo', 'testing stuff')
        RETURNING code, name, description`);
    testCompany = companyResult.rows[0]
})

let testInvoice;
beforeEach(async () => {
  const invoiceResult = await db.query(`
  INSERT INTO invoices (comp_code, amt)
  VALUES ('test', 100)
  RETURNING id, comp_code, amt, paid, add_date, paid_date`)
  testInvoice = invoiceResult.rows[0]
})

afterEach(async () => {
  await db.query(`DELETE FROM invoices`)
})

afterAll(async () => {
  await db.query(`DELETE FROM companies`)
  await db.end()
  spy.mockRestore();
})

describe("GET /invoices", () => {
  test("Get a list of all invoices", async () => {
    const res = await request(app).get('/invoices')
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ invoices: [{
        id: testInvoice.id, 
        add_date: testInvoice.add_date.toJSON(), 
        amt: testInvoice.amt, 
        paid: testInvoice.paid, 
        paid_date: testInvoice.paid_date, 
        comp_code: testCompany.code 
    }]})
  })
})

describe("GET /invoices/:id", () => {
    test("Gets a single invoice", async () => {
      const res = await request(app).get(`/invoices/${testInvoice.id}`)
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ invoice: {
          id: testInvoice.id.toString(), 
          add_date: testInvoice.add_date.toJSON(), 
          amt: testInvoice.amt, 
          paid: testInvoice.paid, 
          paid_date: testInvoice.paid_date, 
          company: {
              code: testCompany.code, 
              description: testCompany.description, 
              name: testCompany.name
            } 
        }})
    })
    test("Responds with 404 for invalid id", async () => {
      const res = await request(app).get(`/invoices/0`)
      expect(res.statusCode).toBe(404);
    })
  })
  
  describe("POST /invoices", () => {
    test("Creates a single invoice", async () => {
      const res = await request(app).post('/invoices').send({ 
          comp_code: testCompany.code, 
          amt: 2500 
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({
        invoice: { 
            id: expect.any(Number), 
            comp_code: testCompany.code, 
            amt: 2500,
            paid: false,
            add_date: mockDateObject.toJSON(),
            paid_date: null 
        }
      })
    })
  })
  
  describe("PUT /invoices/:id", () => {
    test("Updates a single invoice", async () => {
      const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ amt: 6789 });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        invoice: { 
            id: testInvoice.id, 
            comp_code: testCompany.code, 
            amt: 6789,
            paid: false,
            add_date: mockDateObject.toJSON(),
            paid_date: null 
        }
      })
    })
    test("Responds with 404 for invalid id", async () => {
      const res = await request(app).put(`/invoices/0`).send({ amt: 9999 });
      expect(res.statusCode).toBe(404);
    })
  })

  describe("DELETE /invoices/:id", () => {
    test("Deletes a single invoice", async () => {
      const res = await request(app).delete(`/invoices/${testInvoice.id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ status: "deleted" })
    })
    test("Responds with 404 for invalid id", async () => {
        const res = await request(app).delete(`/invoices/0`);
        expect(res.statusCode).toBe(404);
      })
  })
  