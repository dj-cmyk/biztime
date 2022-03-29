const express = require('express');
const ExpressError = require("../expressError");
const router = new express.Router();
const db = require('../db');


// GET /invoices
// Return info on invoices: like {invoices: [{id, comp_code}, ...]}
router.get("/", async function(req, res, next) {
    try {
      const results = await db.query("SELECT * FROM invoices")
      return res.json({invoices: results.rows})
    } catch(e){
      return next(e)
    }
  });


// GET /invoices/[id]
// Returns obj on given invoice.
// If invoice cannot be found, returns 404.
// Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}
router.get("/:id", async function(req, res, next) {
    try {
        const {id} = req.params;
        const result = await db.query(
            `SELECT * FROM invoices 
            JOIN companies ON invoices.comp_code = companies.code 
            WHERE id = $1`, [id])
        if (result.rows.length === 0) {
            throw new ExpressError(`Invoice with id of ${id} does not exist`, 404)
          }

        const {amt, paid, add_date, paid_date} = result.rows[0]
        const {code, name, description} = result.rows[0]

        return res.json({invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}})
        
    } catch(e) {
        return next(e)
    }
});


// POST /invoices
// Adds an invoice.
// Needs to be passed in JSON body of: {comp_code, amt}
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.post("/", async function(req, res, next) {
    try {
        const { comp_code, amt } = req.body;
        const result = await db.query('INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date', [comp_code, amt]);
        return res.status(201).json({ invoice: result.rows[0] })
    } catch(e) {
        return next(e)
    }
})


// PUT /invoices/[id]
// Updates an invoice.
// If invoice cannot be found, returns a 404.
// Needs to be passed in a JSON body of {amt}
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

// 2ND PART
// Needs to be passed in a JSON body of {amt, paid}
// If paying unpaid invoice: sets paid_date to today
// If un-paying: sets paid_date to null
// Else: keep current paid_date
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.put("/:id", async function(req, res, next) {
    try {
        const { id } = req.params;
        const { amt, paid } = req.body;
        // SELECT INVOICE BY ID
        const inv = await db.query(`
            SELECT id, amt, paid, paid_date FROM invoices  
            WHERE id = $1`, [id])
        if (inv.rows.length === 0) {
            throw new ExpressError(`Can't update invoice with id of ${id}`, 404)
        }
        if (inv.rows[0].paid) {      
                let paid_date = null;
                const result = await db.query(`
                    UPDATE invoices 
                    SET amt=$1, paid=$2, paid_date=$3 
                    WHERE id=$4 
                    RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, paid, paid_date, id])
                return res.send({ invoice: result.rows[0] })
            
        } else {
            if (paid) {
                let paid_date = new Date()
                const result = await db.query(`
                    UPDATE invoices 
                    SET amt=$1, paid=$2, paid_date=$3 
                    WHERE id=$4 
                    RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
                    [amt, paid, paid_date, id])
                return res.send({ invoice: result.rows[0] })
            } else {
                const result = await db.query(`
                    UPDATE invoices 
                    SET amt=$1 
                    WHERE id=$2 
                    RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
                    [amt, id])
                return res.send({ invoice: result.rows[0] })
            }  
        }
    } catch(e) {
        return next(e)
    }
})


// DELETE /invoices/[id]
// Deletes an invoice.
// If invoice cannot be found, returns a 404.
// Returns: {status: "deleted"}
router.delete("/:id", async function(req, res, next) {
    try {
        const { id } = req.params;
        const getInvoice = await db.query(`SELECT * FROM invoices where id = $1`, [id])
        if (getInvoice.rows.length === 0) {
            throw new ExpressError(`Invoice with id of ${id} does not exist`, 404)
        }
        const result = await db.query('DELETE FROM invoices WHERE id = $1', [id])
        return res.send({ status: "deleted" })
    } catch(e) {
        return next(e)
    }
})




module.exports = router;