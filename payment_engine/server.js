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

app.post("/payments", async (req, res) => {
  const idempotencyKey = req.headers["idempotency-key"];

   if (!idempotencyKey) {
      return res.status(400).json({
        error: "Idempotency-Key header is required"
      });
    }

  try {
    const { amount, currency = "NGN" } = req.body;

    // Validate amount
    if (
      amount === undefined ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        error: "Amount must be a positive integer in minor currency units"
      });
    }

    // Generate unique identifiers
    const id = crypto.randomUUID();
    const reference = `PAY-${crypto.randomUUID()}`;

    const result = await pool.query(
      `
      INSERT INTO payments
      (id, reference, amount_minor, currency, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        id,
        reference,
        amount,
        currency,
        "PENDING"
      ]
    );

    return res.status(201).json(result.rows[0]);

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