const express = require('express');
const ExpressError = require("../expressError");
const router = new express.Router();
const db = require('../db');


// Add routes for:

// GET /idustries
// Return info on industries: like {industries: {industry name, companies: [company name]}, ...]}
// listing all industries, which should show the company code(s) for that industry

router.get("/", async function(req, res, next) {
    try {
        const industryRes = await db.query(`
        SELECT code, industry FROM industries`)

        const results = industryRes.rows
        
        for (let result of results){
            const compRes = await db.query(`
            SELECT c.code FROM companies AS c
            JOIN companies_industries AS ci
            ON c.code = ci.comp_code
            JOIN industries AS i
            ON ci.industry_code = i.code
            WHERE i.code = $1`, [result.code])

            if (compRes.rows.length > 0){
                result.companies = compRes.rows
            }
        }
        
        return res.json({industry: results})

    } catch(e){
      return next(e)
    }
  });


  // adding an industry
  router.post("/", async function(req, res, next) {
    try {
        const { code, industry } = req.body;
        const results = await db.query(
            `INSERT INTO industries (code, industry) 
            VALUES ($1, $2) RETURNING code, industry`, 
            [code, industry]);
        return res.status(201).json({ industry: results.rows[0] })
    } catch(e) {
        return next(e)
    }
  })


  // associating an industry to a company
  // send industry code and compaany code to companies_industries table
  router.post("/:code", async function(req, res, next) {
      try {
        const {code} = req.params;
        const {comp_code} = req.body;
        const results = await db.query(`
        INSERT INTO companies_industries (comp_code, industry_code)
        VALUES ($1, $2)`, [comp_code, code]);

        return res.status(201).json({ status: "added" })
      } catch(e) {
          return next(e)
      }
  })


  module.exports = router;