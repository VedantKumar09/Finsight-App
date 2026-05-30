# 4.5 ER Diagram / Database Schema

## Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                    FINANCE APP DATABASE SCHEMA (MERN Stack)                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘


                                      ┌──────────────┐
                                      │     USER     │
                                      ├──────────────┤
                                      │ _id (PK)     │
                                      │ email (UK)   │
                                      │ password     │
                                      │ name         │
                                      │ createdAt    │
                                      │ updatedAt    │
                                      └──────┬───────┘
                                             │
                   ┌─────────────────────────┼──────────────────────────┐
                   │                         │                          │
                   │ (1:N)                (1:N)                      (1:N)
                   │                         │                          │
        ┌──────────▼──────────────┐   ┌─────▼──────────┐   ┌──────────▼────┐
        │   KPI (Key Performance  │   │  TRANSACTION   │   │   PRODUCT      │
        │      Indicators)        │   │                │   │                │
        ├─────────────────────────┤   ├────────────────┤   ├────────────────┤
        │ _id (PK)                │   │ _id (PK)       │   │ _id (PK)       │
        │ userId (FK)             │   │ buyer (string) │   │ price          │
        │ totalProfit (currency)  │   │ amount         │   │ expense        │
        │ totalRevenue (currency) │   │ productIds[]   │   │ transactions[] │
        │ totalExpenses (currency)│   │ (FK to Product)│   │ (FK to Tx)     │
        │ expensesByCategory{}    │   │                │   │                │
        │ dailyData[]             │   │                │   │                │
        │ monthlyData[]           │   │                │   │                │
        │ createdAt               │   │ createdAt      │   │ createdAt      │
        │ updatedAt               │   │ updatedAt      │   │ updatedAt      │
        └─────────────────────────┘   └────────────────┘   └────────────────┘
                                              │                      │
                                              │      N:M Relationship│
                                              └──────────────────────┘
                                                (through arrays)
                 
                   ┌───────────────────────────────────────────────┐
                   │                                               │
                   │ (1:N)                                          │
                   │                                               │
        ┌──────────▼────────────┐                     ┌──────────────────┐
        │   PREDICTION           │                    │ Relationship      │
        │                        │                    │ Summary           │
        ├────────────────────────┤                    ├──────────────────┤
        │ _id (PK)               │                    │                  │
        │ userId (FK)            │                    │ USER (1) : (N)   │
        │ predictedProfit        │                    │   └─ KPI         │
        │ inputParameters{}      │                    │   └─ TRANSACTION │
        │ accuracy               │                    │   └─ PREDICTION  │
        │ modelVersion           │                    │                  │
        │ date                   │                    │ TRANSACTION (N)  │
        │ createdAt              │                    │ has many PRODUCT │
        │ updatedAt              │                    │ (M:N via array)  │
        └────────────────────────┘                    │                  │
                                                      │ PRODUCT (N)      │
                                                      │ has many Tx      │
                                                      │ (M:N via array)  │
                                                      └──────────────────┘
```

---

## Database Collections Schema

### 1. USER Collection
**Purpose**: Stores user account credentials and profile information

```javascript
{
  "_id": ObjectId,           // MongoDB generated unique identifier (Primary Key)
  "email": String,           // User email (Unique, Required, used for login)
  "password": String,        // Bcrypt hashed password (never plain text)
  "name": String,            // User's full name
  "createdAt": DateTime,     // Account creation timestamp
  "updatedAt": DateTime      // Last modification timestamp
}
```

**Constraints**:
- `_id`: Primary Key, Auto-generated by MongoDB
- `email`: Unique, Required, Email format validation
- `password`: Required, Minimum 6 characters, Hashed with bcrypt (salt rounds: 10)
- `name`: Optional

**Indexes**:
```javascript
db.users.createIndex({ "email": 1 }, { unique: true })
```

**Sample Document**:
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "vedant@example.com",
  "password": "$2b$10$8qzBbVqU5.8qZ3Zz.Z5ZuOtVPU5Qz5uZ3Zz.Z5ZuOtVPU5Q",
  "name": "Vedant Kumar",
  "createdAt": ISODate("2025-12-14T10:30:00Z"),
  "updatedAt": ISODate("2025-12-14T10:30:00Z")
}
```

---

### 2. KPI Collection (Key Performance Indicators)
**Purpose**: Stores financial KPIs including total profit, revenue, expenses with daily and monthly breakdown

```javascript
{
  "_id": ObjectId,                          // Unique identifier (Primary Key)
  "userId": ObjectId,                       // Foreign Key reference to USER._id
  "totalProfit": Number,                    // Currency value - Sum of all profits
  "totalRevenue": Number,                   // Currency value - Total income/revenue
  "totalExpenses": Number,                  // Currency value - Total expenses
  "expensesByCategory": {                   // Map of category name to currency amount
    "string": Number,                       // e.g., { "food": 50000, "utilities": 30000 }
    ...
  },
  "dailyData": [                            // Array of daily financial snapshots
    {
      "date": Date,                         // YYYY-MM-DD
      "revenue": Number,
      "expenses": Number,
      "profit": Number
    }
  ],
  "monthlyData": [                          // Array of monthly financial summary
    {
      "month": String,                      // Format: "YYYY-MM"
      "revenue": Number,
      "expenses": Number,
      "profit": Number,
      "expensesByCategory": {
        "string": Number
      }
    }
  ],
  "createdAt": DateTime,                    // Record creation timestamp
  "updatedAt": DateTime                     // Last update timestamp
}
```

**Constraints**:
- `_id`: Primary Key
- `userId`: Foreign Key, Required, References USER._id
- `totalProfit`, `totalRevenue`, `totalExpenses`: Non-negative numbers (Currency)
- `expensesByCategory`: Key-value pairs with string keys and currency values

**Indexes**:
```javascript
db.kpis.createIndex({ "userId": 1 }, { unique: true })
db.kpis.createIndex({ "userId": 1, "createdAt": -1 })
```

**Sample Document**:
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "totalProfit": 550000,
  "totalRevenue": 1200000,
  "totalExpenses": 650000,
  "expensesByCategory": {
    "food": 120000,
    "utilities": 80000,
    "transport": 150000,
    "entertainment": 100000,
    "other": 200000
  },
  "dailyData": [
    {
      "date": ISODate("2025-12-13"),
      "revenue": 50000,
      "expenses": 30000,
      "profit": 20000
    },
    {
      "date": ISODate("2025-12-14"),
      "revenue": 55000,
      "expenses": 32000,
      "profit": 23000
    }
  ],
  "monthlyData": [
    {
      "month": "2025-11",
      "revenue": 580000,
      "expenses": 320000,
      "profit": 260000,
      "expensesByCategory": {
        "food": 60000,
        "utilities": 40000,
        "transport": 75000,
        "entertainment": 50000,
        "other": 95000
      }
    },
    {
      "month": "2025-12",
      "revenue": 620000,
      "expenses": 330000,
      "profit": 290000,
      "expensesByCategory": {
        "food": 60000,
        "utilities": 40000,
        "transport": 75000,
        "entertainment": 50000,
        "other": 105000
      }
    }
  ],
  "createdAt": ISODate("2025-12-14T10:30:00Z"),
  "updatedAt": ISODate("2025-12-14T10:30:00Z")
}
```

---

### 3. TRANSACTION Collection
**Purpose**: Stores individual financial transactions with product references (M:N relationship)

```javascript
{
  "_id": ObjectId,                      // Unique identifier (Primary Key)
  "buyer": String,                      // Name of buyer/transaction party
  "amount": Number,                     // Currency - Transaction total amount
  "productIds": [ObjectId],             // Array of Foreign Keys referencing PRODUCT._id
  "createdAt": DateTime,                // Record creation timestamp
  "updatedAt": DateTime                 // Last update timestamp
}
```

**Constraints**:
- `_id`: Primary Key
- `buyer`: Required, String
- `amount`: Required, Positive number (Currency)
- `productIds`: Array of Object IDs, References PRODUCT._id (Many-to-Many)
- At least one productId required

**Indexes**:
```javascript
db.transactions.createIndex({ "buyer": 1 })
db.transactions.createIndex({ "productIds": 1 })
db.transactions.createIndex({ "createdAt": -1 })
```

**Sample Document**:
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "buyer": "John Doe",
  "amount": 15000,
  "productIds": [
    ObjectId("507f1f77bcf86cd799439020"),
    ObjectId("507f1f77bcf86cd799439021")
  ],
  "createdAt": ISODate("2025-12-14T09:00:00Z"),
  "updatedAt": ISODate("2025-12-14T09:00:00Z")
}
```

---

### 4. PRODUCT Collection
**Purpose**: Stores product information with pricing and expense tracking (M:N relationship with TRANSACTION)

```javascript
{
  "_id": ObjectId,                      // Unique identifier (Primary Key)
  "price": Number,                      // Currency - Product selling price
  "expense": Number,                    // Currency - Cost/expense to produce product
  "transactions": [ObjectId],           // Array of Foreign Keys referencing TRANSACTION._id
  "createdAt": DateTime,                // Record creation timestamp
  "updatedAt": DateTime                 // Last update timestamp
}
```

**Constraints**:
- `_id`: Primary Key
- `price`: Required, Positive number (Currency)
- `expense`: Required, Positive number (Currency, typically ≤ price)
- `transactions`: Array of Transaction ObjectIds (Many-to-Many)
- Profit per product = price - expense

**Indexes**:
```javascript
db.products.createIndex({ "price": 1 })
db.products.createIndex({ "expense": 1 })
db.products.createIndex({ "transactions": 1 })
```

**Sample Document**:
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439020"),
  "price": 8000,
  "expense": 3000,
  "transactions": [
    ObjectId("507f1f77bcf86cd799439013"),
    ObjectId("507f1f77bcf86cd799439015")
  ],
  "createdAt": ISODate("2025-12-14T10:30:00Z"),
  "updatedAt": ISODate("2025-12-14T10:30:00Z")
}
```

---

### 5. PREDICTION Collection
**Purpose**: Stores ML model predictions for profit forecasting

```javascript
{
  "_id": ObjectId,                      // Unique identifier (Primary Key)
  "userId": ObjectId,                   // Foreign Key reference to USER._id
  "predictedProfit": Number,            // ML model predicted profit value
  "inputParameters": {                  // Object containing features used for prediction
    "revenue": Number,
    "expenses": Number,
    "totalTransactions": Number,
    "avgTransactionValue": Number,
    "expensesByCategory": {
      "string": Number
    },
    "seasonality": Number,
    "trend": Number,
    "historicalAverage": Number,
    ...                                 // Additional ML features as needed
  },
  "accuracy": Number,                   // Model accuracy metric (0.0-1.0)
  "modelVersion": String,               // Version of ML model (e.g., "RandomForest_v1.0")
  "date": Date,                         // Prediction date (YYYY-MM-DD)
  "createdAt": DateTime,                // Record creation timestamp
  "updatedAt": DateTime                 // Last modification timestamp
}
```

**Constraints**:
- `_id`: Primary Key
- `userId`: Foreign Key, Required, References USER._id
- `predictedProfit`: Required, Number
- `inputParameters`: Required, Object with model features
- `accuracy`: Optional, Range: 0.0-1.0
- `modelVersion`: Optional, String format

**Indexes**:
```javascript
db.predictions.createIndex({ "userId": 1 })
db.predictions.createIndex({ "userId": 1, "date": -1 })
db.predictions.createIndex({ "userId": 1, "createdAt": -1 })
```

**Sample Document**:
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439016"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "predictedProfit": 580000,
  "inputParameters": {
    "revenue": 1250000,
    "expenses": 670000,
    "totalTransactions": 145,
    "avgTransactionValue": 8620,
    "expensesByCategory": {
      "food": 125000,
      "utilities": 82000,
      "transport": 155000,
      "entertainment": 105000,
      "other": 203000
    },
    "seasonality": 0.98,
    "trend": 1.05,
    "historicalAverage": 550000
  },
  "accuracy": 0.87,
  "modelVersion": "RandomForest_v1.0",
  "date": ISODate("2025-12-14"),
  "createdAt": ISODate("2025-12-14T14:00:00Z"),
  "updatedAt": ISODate("2025-12-14T14:00:00Z")
}
```

---

## Relationships and Cardinality

| Relationship | Cardinality | Type | Description |
|---|---|---|---|
| USER to KPI | 1:1 | Foreign Key | One user has exactly one KPI record |
| USER to TRANSACTION | 1:N | Implicit | One user can be referenced across system transactions |
| USER to PREDICTION | 1:N | Foreign Key | One user has multiple ML predictions |
| TRANSACTION to PRODUCT | M:N | Array Reference | Many transactions can contain many products (stored as arrays) |
| PRODUCT to TRANSACTION | M:N | Array Reference | Many products can appear in many transactions (stored as arrays) |

**Key Design Principle**: 
- **1:N Relationships**: USER → KPI (userId reference), USER → PREDICTION (userId reference)
- **M:N Relationships**: TRANSACTION ↔ PRODUCT (via arrays - `productIds` in TRANSACTION, `transactions` in PRODUCT)
- **No userId in TRANSACTION/PRODUCT**: These are system-wide collections, not per-user segregated
- **Data Relationship**: TRANSACTION.amount is influenced by PRODUCT prices and expenses

---

## Data Access Patterns

### Authentication & User Lookup
```javascript
// Get user by email for login
db.users.findOne({ email: "vedant@example.com" })

// Verify password (done in application, password is hashed with bcrypt)
bcrypt.compare(inputPassword, user.password)
  .then(isValid => {
    if (isValid) {
      // Generate JWT token
      generateJWT(user._id)
    }
  })
```

### Dashboard Data Retrieval
```javascript
// Get KPI for all users (dashboard overview)
db.kpis.findOne()

// Get KPI with monthly breakdown
db.kpis.findOne({}, { monthlyData: 1, expensesByCategory: 1 })

// Get all transactions with product details
db.transactions.aggregate([
  {
    $lookup: {
      from: "products",
      localField: "productIds",
      foreignField: "_id",
      as: "productDetails"
    }
  }
])

// Get all products
db.products.find()

// Get top performing products (by transaction count)
db.products.aggregate([
  { $addFields: { transactionCount: { $size: "$transactions" } } },
  { $sort: { transactionCount: -1 } }
])
```

### Transaction-Product Relationships
```javascript
// Get all transactions with their associated products
db.transactions.aggregate([
  {
    $lookup: {
      from: "products",
      localField: "productIds",
      foreignField: "_id",
      as: "productDetails"
    }
  },
  { $sort: { createdAt: -1 } }
])

// Get all products with their transaction history
db.products.aggregate([
  {
    $lookup: {
      from: "transactions",
      localField: "transactions",
      foreignField: "_id",
      as: "transactionHistory"
    }
  },
  { $sort: { "transactionHistory.createdAt": -1 } }
])

// Calculate product profitability (revenue - expense)
db.products.aggregate([
  {
    $addFields: {
      profitPerUnit: { $subtract: ["$price", "$expense"] }
    }
  },
  {
    $lookup: {
      from: "transactions",
      localField: "transactions",
      foreignField: "_id",
      as: "transactionHistory"
    }
  },
  {
    $addFields: {
      totalProfit: {
        $multiply: [
          { $size: "$transactionHistory" },
          { $subtract: ["$price", "$expense"] }
        ]
      }
    }
  },
  { $sort: { totalProfit: -1 } }
])
```

### Prediction System
```javascript
// Make a new prediction
db.predictions.insertOne({
  userId: ObjectId("507f1f77bcf86cd799439011"),
  predictedProfit: 580000,
  inputParameters: {
    revenue: 1250000,
    expenses: 670000,
    totalTransactions: 145,
    avgTransactionValue: 8620,
    seasonality: 0.98,
    trend: 1.05,
    historicalAverage: 550000
  },
  accuracy: 0.87,
  modelVersion: "RandomForest_v1.0",
  date: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
})

// Get prediction history for a user
db.predictions.find({ userId: ObjectId("507f1f77bcf86cd799439011") })
  .sort({ date: -1 })
  .limit(10)

// Get most recent prediction
db.predictions.findOne({ userId: ObjectId("507f1f77bcf86cd799439011") })
  .sort({ date: -1 })
```

### Analytics Queries
```javascript
// Calculate total transaction value and count
db.transactions.aggregate([
  {
    $group: {
      _id: null,
      totalValue: { $sum: "$amount" },
      transactionCount: { $sum: 1 },
      avgTransaction: { $avg: "$amount" }
    }
  }
])

// Get buyer-wise transaction summary
db.transactions.aggregate([
  {
    $group: {
      _id: "$buyer",
      totalSpent: { $sum: "$amount" },
      transactionCount: { $sum: 1 },
      avgTransaction: { $avg: "$amount" }
    }
  },
  { $sort: { totalSpent: -1 } }
])

// Get product performance metrics
db.products.aggregate([
  {
    $addFields: {
      transactionCount: { $size: "$transactions" },
      profitPerUnit: { $subtract: ["$price", "$expense"] },
      totalRevenue: { $multiply: [{ $size: "$transactions" }, "$price"] },
      totalExpense: { $multiply: [{ $size: "$transactions" }, "$expense"] }
    }
  },
  {
    $addFields: {
      totalProfit: { $subtract: ["$totalRevenue", "$totalExpense"] }
    }
  },
  { $sort: { totalProfit: -1 } }
])

// Calculate KPI metrics from transactions and products
db.transactions.aggregate([
  {
    $lookup: {
      from: "products",
      localField: "productIds",
      foreignField: "_id",
      as: "products"
    }
  },
  {
    $group: {
      _id: null,
      totalRevenue: { $sum: "$amount" },
      totalTransactions: { $sum: 1 },
      totalExpense: {
        $sum: {
          $sum: {
            $map: {
              input: "$products",
              as: "product",
              in: {
                $multiply: [
                  "$$product.expense",
                  { $size: "$productIds" }
                ]
              }
            }
          }
        }
      }
    }
  },
  {
    $addFields: {
      totalProfit: { $subtract: ["$totalRevenue", "$totalExpense"] }
    }
  }
])
```

---

## Data Integrity & Security

### Primary Key Strategy
- MongoDB's ObjectId provides unique identification
- Auto-generated, distributed-friendly, timestamp-based
- Ensures unique identification for all documents across all collections

### Foreign Key Strategy
- **USER to KPI**: `userId` reference in KPI document
- **USER to PREDICTION**: `userId` reference in PREDICTION document
- **TRANSACTION to PRODUCT**: Bidirectional array references (`productIds` in TRANSACTION, `transactions` in PRODUCT)
- Application enforces referential integrity (no DB-level foreign key constraints in MongoDB)

### Security Measures
1. **Password Hashing**: bcryptjs with salt rounds = 10
2. **JWT Tokens**: Stateless authentication on API endpoints
3. **Input Validation**: Server-side validation before database operations
4. **Indexes on Foreign Keys**: Fast lookup performance
5. **Unique Constraint on Email**: Prevents duplicate user accounts
6. **No Sensitive Data in Arrays**: Product and Transaction arrays only store ObjectIds, not sensitive data

---

## Database Normalization

This design follows **Third Normal Form (3NF)** with strategic denormalization:

**Normalized Aspects**:
- Each collection represents a single entity
- No repeating attributes (except controlled arrays)
- All non-key attributes depend on the primary key
- No transitive dependencies

**Denormalization Strategy**:
- `expensesByCategory` object in KPI collection: Denormalized for fast dashboard queries
- `dailyData` array in KPI collection: Aggregated data for performance
- `monthlyData` array in KPI collection: Pre-calculated summaries
- Bidirectional references (TRANSACTION.productIds ↔ PRODUCT.transactions): Enables efficient querying from both directions

**Rationale for Denormalization**:
1. **Dashboard Performance**: Single KPI read returns all KPI data
2. **Analytics Speed**: Aggregated monthly data avoids computation
3. **MongoDB Design Pattern**: Document-oriented databases benefit from embedding related data
4. **Read-Heavy Workload**: Denormalization optimizes for reads, which dominate this application
5. **Array References**: Allow efficient M:N queries without separate junction tables

---

## Scalability Considerations

### Horizontal Scaling (Sharding)
For production at scale, consider sharding by high-cardinality fields:

```javascript
// Shard by _id for even distribution
sh.shardCollection("finance_db.users", { "_id": "hashed" })
sh.shardCollection("finance_db.kpis", { "_id": "hashed" })
sh.shardCollection("finance_db.transactions", { "_id": "hashed" })
sh.shardCollection("finance_db.products", { "_id": "hashed" })
sh.shardCollection("finance_db.predictions", { "_id": "hashed" })
```

### Index Strategy for Performance
- **Email Index**: Fast user lookups during authentication
- **ProductIds Index**: Efficient product lookups in transactions
- **Transactions Index**: Quick transaction history retrieval
- **Buyer Index**: Fast transaction filtering by buyer
- **CreatedAt Index**: Sorted queries for recent records
- **Combined Indexes**: userId + date for efficient time-range queries

### Data Archiving
For long-term performance:
- Archive old TRANSACTION records to separate collection
- Maintain KPI aggregations for historical analysis
- Use TTL (Time-To-Live) indexes for temporary data if needed
- Consider snapshot pattern for KPI historical tracking
