# Finance App - Complete Database Design Summary

## Overview
Your finance application uses a **MongoDB MERN stack** with 5 main collections structured to support financial tracking, KPI management, and ML-based profit prediction.

---

## Collection Summary

| Collection | Purpose | Key Fields | Relationships |
|---|---|---|---|
| **USER** | User accounts & authentication | email, password, name | Parent for KPI, PREDICTION |
| **KPI** | Key Performance Indicators | totalProfit, totalRevenue, totalExpenses, monthlyData, expensesByCategory | Child of USER (1:1) |
| **TRANSACTION** | Individual transactions | buyer, amount, productIds[] | M:N with PRODUCT |
| **PRODUCT** | Product catalog with pricing | price, expense, transactions[] | M:N with TRANSACTION |
| **PREDICTION** | ML profit predictions | predictedProfit, inputParameters, accuracy | Child of USER (1:N) |

---

## Key Relationships

### 1. USER → KPI (1:1)
```
One user has exactly ONE KPI record
- USER._id references
- KPI.userId (Foreign Key)
- Unique index on userId in KPI
```

### 2. USER → PREDICTION (1:N)
```
One user can have MANY predictions
- USER._id references
- PREDICTION.userId (Foreign Key)
- Multiple predictions per user for history tracking
```

### 3. TRANSACTION ↔ PRODUCT (M:N)
```
Many transactions contain many products
Bidirectional array references:
- TRANSACTION.productIds[] → References PRODUCT._id
- PRODUCT.transactions[] → References TRANSACTION._id

This enables:
- Query: "Which products are in this transaction?"
- Query: "Which transactions contain this product?"
```

---

## Field Specifications

### Currency Fields
All monetary values use **Number** type:
- KPI: totalProfit, totalRevenue, totalExpenses
- KPI.expensesByCategory: Object with category strings mapping to currency numbers
- PRODUCT: price, expense
- TRANSACTION: amount
- PREDICTION: predictedProfit

### Array Fields
- **KPI.dailyData**: Array of daily snapshots
  ```javascript
  [
    { date: Date, revenue: Number, expenses: Number, profit: Number },
    ...
  ]
  ```

- **KPI.monthlyData**: Array of monthly summaries
  ```javascript
  [
    { 
      month: "YYYY-MM", 
      revenue: Number, 
      expenses: Number, 
      profit: Number,
      expensesByCategory: Object
    },
    ...
  ]
  ```

- **TRANSACTION.productIds**: Array of product references
  ```javascript
  [ObjectId, ObjectId, ...]
  ```

- **PRODUCT.transactions**: Array of transaction references
  ```javascript
  [ObjectId, ObjectId, ...]
  ```

---

## Calculation Logic

### KPI Calculations
```
totalProfit = totalRevenue - totalExpenses
```

### Product Profitability
```
profitPerUnit = price - expense
totalProductProfit = profitPerUnit × number_of_transactions
```

### Transaction Impact
```
When transaction is created:
- Amount = sum of selected product prices
- Update KPI: totalRevenue, totalProfit
- Update PRODUCT: add transaction ID to transactions array
```

---

## Access Patterns & Queries

### Common Dashboard Queries

**1. Get Dashboard Overview**
```javascript
// Single query gets all KPI data
db.kpis.findOne()
// Returns: totalProfit, totalRevenue, totalExpenses, monthlyData, expensesByCategory, dailyData
```

**2. Get All Transactions with Product Details**
```javascript
db.transactions.aggregate([
  { $lookup: { from: "products", localField: "productIds", foreignField: "_id", as: "products" } }
])
```

**3. Get Product Performance**
```javascript
db.products.aggregate([
  { $addFields: { transactionCount: { $size: "$transactions" } } },
  { $addFields: { totalRevenue: { $multiply: [{ $size: "$transactions" }, "$price"] } } },
  { $addFields: { totalExpense: { $multiply: [{ $size: "$transactions" }, "$expense"] } } },
  { $addFields: { totalProfit: { $subtract: ["$totalRevenue", "$totalExpense"] } } },
  { $sort: { totalProfit: -1 } }
])
```

**4. Get Buyer-wise Summary**
```javascript
db.transactions.aggregate([
  { $group: { _id: "$buyer", totalSpent: { $sum: "$amount" }, count: { $sum: 1 } } },
  { $sort: { totalSpent: -1 } }
])
```

---

## Design Decisions

### Why Bidirectional References?
- **Performance**: Query efficiency from both directions
- **Data Consistency**: Easier to maintain relationships
- **Query Flexibility**: Choose optimal direction for each query

### Why Embedded Arrays for KPI?
- **Single Read**: Get all KPI data in one query
- **Fast Dashboard**: No joins needed for chart rendering
- **Historical Data**: Month-by-month and day-by-day trends pre-calculated

### Why M:N Arrays instead of Junction Table?
- **MongoDB Pattern**: Document-oriented databases prefer embedding arrays
- **Flexibility**: No rigid third table structure
- **Queries**: $lookup operator handles array joining efficiently

### No userId in TRANSACTION/PRODUCT?
- **System-Wide View**: These are global collections
- **Shared Data**: Transactions and products can be accessed at system level
- **Prediction Input**: ML model sees all transactions/products for comprehensive analysis

---

## Index Strategy

```javascript
// User authentication
db.users.createIndex({ email: 1 }, { unique: true })

// KPI access
db.kpis.createIndex({ userId: 1 }, { unique: true })

// Transaction lookups
db.transactions.createIndex({ buyer: 1 })
db.transactions.createIndex({ productIds: 1 })
db.transactions.createIndex({ createdAt: -1 })

// Product relationships
db.products.createIndex({ price: 1 })
db.products.createIndex({ expense: 1 })
db.products.createIndex({ transactions: 1 })

// Prediction history
db.predictions.createIndex({ userId: 1 })
db.predictions.createIndex({ userId: 1, date: -1 })
db.predictions.createIndex({ userId: 1, createdAt: -1 })
```

---

## Data Flow Example

### Creating a Transaction
```
1. User selects products [Product A, Product B]
2. Frontend calculates: amount = A.price + B.price
3. Backend creates TRANSACTION document:
   {
     buyer: "John Doe",
     amount: <calculated sum>,
     productIds: [A._id, B._id]
   }
4. Update KPI:
   - totalRevenue += amount
   - totalProfit = totalRevenue - totalExpenses
   - Update monthlyData for current month
   - Update dailyData for today
5. Update both PRODUCT A and B:
   - Add transaction._id to transactions array
6. Response sent to frontend
7. Frontend refreshes dashboard with new data
```

### ML Prediction Flow
```
1. Frontend requests prediction for user
2. Backend queries KPI for current metrics
3. Aggregates TRANSACTION data for input features
4. Calls Python ML model with:
   {
     revenue: KPI.totalRevenue,
     expenses: KPI.totalExpenses,
     totalTransactions: TRANSACTION.count,
     avgTransactionValue: calculated average,
     expensesByCategory: KPI.expensesByCategory,
     seasonality: calculated,
     trend: calculated
   }
5. Receives predictedProfit from Random Forest model
6. Creates PREDICTION document
7. Returns prediction with accuracy to frontend
```

---

## Scalability Notes

### Vertical Scaling
- Index strategy ensures O(log n) queries
- KPI denormalization prevents repeated calculations
- Array lookups with $lookup are optimized

### Horizontal Scaling (Future)
- Shard by _id with hashing for even distribution
- Shard products separately from transactions if needed
- Consider separate collection for PREDICTION history archive

### Performance Optimization
- Eager loading: Use $lookup for transaction details
- Lazy loading: Load products only when needed
- Caching: Cache KPI data with short TTL (5-15 minutes)
- Aggregation: Pre-calculate monthlyData instead of computing on-the-fly

---

## Sample Data Relationships

```javascript
// USER Document
{
  _id: ObjectId("user1"),
  email: "vedant@example.com",
  password: "<bcrypt_hash>",
  name: "Vedant Kumar"
}

// Related KPI Document
{
  _id: ObjectId("kpi1"),
  userId: ObjectId("user1"),
  totalProfit: 550000,
  totalRevenue: 1200000,
  totalExpenses: 650000,
  expensesByCategory: {
    "food": 120000,
    "utilities": 80000
  },
  monthlyData: [
    { month: "2025-12", profit: 290000, revenue: 620000, expenses: 330000 }
  ],
  dailyData: [
    { date: "2025-12-14", profit: 23000, revenue: 55000, expenses: 32000 }
  ]
}

// PRODUCT Documents
{
  _id: ObjectId("prod1"),
  price: 8000,
  expense: 3000,
  transactions: [ObjectId("tx1"), ObjectId("tx3")]
}

// TRANSACTION Document
{
  _id: ObjectId("tx1"),
  buyer: "John Doe",
  amount: 15000,
  productIds: [ObjectId("prod1"), ObjectId("prod2")]
}

// PREDICTION Document
{
  _id: ObjectId("pred1"),
  userId: ObjectId("user1"),
  predictedProfit: 580000,
  inputParameters: { /* ... */ },
  accuracy: 0.87,
  modelVersion: "RandomForest_v1.0",
  date: "2025-12-14"
}
```

---

## Summary

Your database design is **optimized for**:
- ✅ Fast dashboard rendering (single KPI read)
- ✅ Flexible transaction querying (bidirectional product refs)
- ✅ ML predictions (comprehensive system-wide data)
- ✅ User data isolation (separate KPI and PREDICTION per user)
- ✅ Historical tracking (daily and monthly data)

**Total Collections**: 5  
**Total Relationships**: 4 (USER→KPI, USER→PREDICTION, TRANSACTION↔PRODUCT)  
**Index Count**: 12+ for optimal performance  
**Normalization Level**: 3NF with controlled denormalization
