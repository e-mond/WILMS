# Forecasting assumptions (v1.7)

- Horizon in days, converted to whole weeks
- Expected = current weekly due × weeks
- Projected = expected × max(0.4, min(1, collectionRate))
- Expenses scale linearly from recent intensity
- Not a credit-scoring or ML model
