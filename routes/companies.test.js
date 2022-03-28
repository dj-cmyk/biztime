process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
beforeEach(async () => {
  const result = await db.query(`
    INSERT INTO companies (code, name, description) 
    VALUES ('fake', 'FakeCo', 'does stuff')
    RETURNING code, name, description`);
  testCompany = result.rows[0]
})

afterEach(async () => {
  await db.query(`DELETE FROM companies`)
})

afterAll(async () => {
  await db.end()
})

describe("GET /companies", () => {
  test("Get a list of all companies", async () => {
    const res = await request(app).get('/companies')
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [{"code": testCompany.code, "name": testCompany.name}] })
  })
})

describe("GET /companies/:code", () => {
  test("Gets a single company", async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`)
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ company: testCompany })
  })
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).get(`/companies/anything`)
    expect(res.statusCode).toBe(404);
  })
})

describe("POST /companies", () => {
  test("Creates a single company", async () => {
    const res = await request(app).post('/companies').send({ code: 'Co1', name: 'Company One', description: 'one company one' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: { code: 'Co1', name: 'Company One', description: 'one company one' }
    })
  })
})

describe("PUT /companies/:code", () => {
  test("Updates a single company", async () => {
    const res = await request(app).put(`/companies/${testCompany.code}`).send({ name: 'newCo', description: 'new stuff' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: { code: testCompany.code, name: 'newCo', description: 'new stuff' }
    })
  })
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).put(`/companies/anything`).send({ name: 'invalidCo', description: 'invalid description' });
    expect(res.statusCode).toBe(404);
  })
})

describe("DELETE /companies/:code", () => {
  test("Deletes a single company", async () => {
    const res = await request(app).delete(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "deleted" })
  })
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).delete(`/companies/anything`);
    expect(res.statusCode).toBe(404);
  })
})


