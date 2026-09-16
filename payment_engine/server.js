const express = require("express");
const crypto = require("crypto");
const pool = require("./db.js");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Payment Engine API is running"
  });
});


// app.post("/payments", async (req, res) => {
//   try {
//     const idempotencyKey = req.headers["idempotency-key"];

//     if (!idempotencyKey) {
//       return res.status(400).json({
//         error: "Idempotency-Key header is required"
//       });
//     }

//     const { amount, currency = "NGN" } = req.body;

//     if (
//       amount === undefined ||
//       !Number.isInteger(amount) ||
//       amount <= 0
//     ) {
//       return res.status(400).json({
//         error: "Amount must be a positive integer"
//       });
//     }

//     // Check whether this request was already processed
//     const existingPayment = await pool.query(
//       `
//       SELECT *
//       FROM payments
//       WHERE idempotency_key = $1
//       `,
//       [idempotencyKey]
//     );

//     if (existingPayment.rows.length > 0) {
//       return res.status(200).json({
//         message: "Payment already exists",
//         payment: existingPayment.rows[0]
//       });
//     }

//     const id = crypto.randomUUID();

//     const reference = `PAY-${crypto.randomUUID()}`;

//     const result = await pool.query(
//       `
//       INSERT INTO payments
//       (id, reference, amount_minor, currency, status, idempotency_key)
//       VALUES ($1, $2, $3, $4, $5, $6)
//       RETURNING *
//       `,
//       [
//         id,
//         reference,
//         amount,
//         currency,
//         "PENDING",
//         idempotencyKey
//       ]
//     );

//     return res.status(201).json({
//       message: "Payment created",
//       payment: result.rows[0]
//     });

//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       error: "Failed to create payment"
//     });
//   }
// });

app.post("/payments", async (req, res) => {
  try {
    const idempotencyKey = req.headers["idempotency-key"];

    if (!idempotencyKey) {
      return res.status(400).json({
        error: "Idempotency-Key header is required"
      });
    }

    const { amount, currency = "NGN" } = req.body;

    if (
      amount === undefined ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        error: "Amount must be a positive integer"
      });
    }

    const id = crypto.randomUUID();
    const reference = `PAY-${crypto.randomUUID()}`;

    const result = await pool.query(
      `
      INSERT INTO payments
      (id, reference, amount_minor, currency, status, idempotency_key)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING *
      `,
      [
        id,
        reference,
        amount,
        currency,
        "PENDING",
        idempotencyKey
      ]
    );

    // Payment already existed
    if (result.rows.length === 0) {
      const existingPayment = await pool.query(
        `
        SELECT *
        FROM payments
        WHERE idempotency_key = $1
        `,
        [idempotencyKey]
      );

      return res.status(200).json({
        message: "Payment already exists",
        payment: existingPayment.rows[0]
      });
    }

    return res.status(201).json({
      message: "Payment created",
      payment: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to create payment"
    });
  }
});
app.listen(3000, () => {
  console.log("Payment engine running on port 3000");
});