const express = require('express');
const ExpressError = require("../expressError");
const router = new express.Router();
const db = require('../db');


//   GET /companies
//   Returns list of companies, like {companies: [{code, name}, ...]}
router.get("/", async function(req, res, next) {
    try {
      const result = await db.query("SELECT code, name FROM companies")
      return res.json({companies: result.rows})
    } catch(e){
      return next(e)
    }
  });


//   GET /companies/[code]
//   Return obj of company: {company: {code, name, description}}
//   If the company given cannot be found, this should return a 404 status response.
// update for step 3 - 
// GET /companies/[code]
// Return obj of company: {company: {code, name, description, invoices: [id, ...]}}
// If the company given cannot be found, this should return a 404 status response.
router.get("/:code", async function(req, res, next) {
    try {
        const {code} = req.params;
        const result = await db.query(`SELECT * FROM companies WHERE code = $1`, [code])
        if (result.rows.length === 0) {
            throw new ExpressError(`Company with code of ${code} does not exist`, 404)
          }
        return res.json({company: result.rows[0]})
    } catch(e) {
        return next(e)
    }
});
  

//   POST /companies
//   Adds a company.
//   Needs to be given JSON like: {code, name, description}
//   Returns obj of new company: {company: {code, name, description}}
router.post("/", async function(req, res, next) {
    try {
        const { code, name, description } = req.body;
        const results = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [code, name, description]);
        return res.status(201).json({ company: results.rows[0] })
    } catch(e) {
        return next(e)
    }
})



//   PUT /companies/[code]
//   Edit existing company.
//   Should return 404 if company cannot be found.
//   Needs to be given JSON like: {name, description}
//   Returns update company object: {company: {code, name, description}}
router.put("/:code", async function(req, res, next) {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const result = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code])
        if (result.rows.length === 0) {
            throw new ExpressError(`Can't update company with code of ${code}`, 404)
        }
        return res.send({ company: result.rows[0] })
    } catch(e) {
        return next(e)
    }
})


//   DELETE /companies/[code]
//   Deletes company.
//   Should return 404 if company cannot be found.
//   Returns {status: "deleted"}
router.delete("/:code", async function(req, res, next) {
    try {
        const { code } = req.params;
        const getCo = await db.query(`SELECT * FROM companies where code = $1`, [code])
        if (getCo.rows.length === 0) {
            throw new ExpressError(`Company with code of ${code} does not exist`, 404)
        }
        const result = await db.query('DELETE FROM companies WHERE code = $1', [code])
        return res.send({ status: "deleted" })
    } catch(e) {
        return next(e)
    }
})



module.exports = router;