const express = require("express");

const app = express();

app.use(express.json());
const payments = [];

app.get("/", (req, res) => {
  res.json({
    message: "Payment Engine API is running"
  });
});


app.post("/payments", (req, res) => {
  const { amount } = req.body;

  // Validate amount
  if (
    amount === undefined ||
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return res.status(400).json({
      error: "Invalid amount"
    });
  }

  const payment = {
    id: payments.length + 1,
    reference: `PAY-${Date.now()}`,
    amount,
    status: "PENDING"
  };

  payments.push(payment);

  return res.status(201).json(payment);
});



app.listen(3000, () => {
  console.log("Payment engine running on port 3000");
});