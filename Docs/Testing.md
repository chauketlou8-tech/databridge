## Tests

DataBridge uses Jest for unit testing and manual tests for integration testing.

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/PostgreSQLDriver.test.ts

# Run tests in watch mode
npm test -- --watch

# Run manual tests
npm run test:manual
```

### Test Structure

```
tests/
├── PostgreSQLDriver.test.ts   # Jest tests for PostgreSQL
├── DataBridge.test.ts         # Jest tests for DataBridge core
├── cli.test.ts               # Jest tests for CLI
├── manual/
│   ├── PostgreSQLDriver.test.ts  # Manual PostgreSQL tests
│   ├── MysqlDriver.test.ts       # Manual MySQL tests
│   ├── MongoDriver.test.ts       # Manual MongoDB tests
│   └── SQLiteDriver.test.ts      # Manual SQLite tests
└── helpers/
    └── cli-runner.ts         # CLI test helper
```

### Writing Tests

**Jest Test Example:**

```typescript
// tests/PostgreSQLDriver.test.ts
import { DataBridge } from "../src/core/DataBridge";
import { DriverError } from "../src/exceptions";

describe("PostgreSQL Driver", () => {
    it("should connect with valid URL", async () => {
        const db = await DataBridge.connect({
            provider: "postgres",
            url: "postgres://localhost:5432/testdb"
        });
        expect(db).toBeDefined();
    });

    it("should throw DriverError when URL is empty", async () => {
        await expect(DataBridge.connect({
            provider: "postgres",
            url: ""
        })).rejects.toThrow(DriverError);
    });
});
```

**Manual Test Example:**

```typescript
// tests/manual/PostgreSQLDriver.test.ts
import { DataBridge } from "../../src/core/DataBridge";

async function run() {
    console.log("=== Testing PostgreSQL Driver ===\n");

    console.log("Test 1: Valid connection");
    const db = await DataBridge.connect({
        provider: "postgres",
        url: "postgres://localhost:5432/testdb"
    });
    console.log("✅ Connected:", db);

    console.log("\nTest 2: Empty URL");
    await DataBridge.connect({
        provider: "postgres",
        url: ""
    });
}

run();
```

### Test Coverage

| Component      | Coverage |
|----------------|----------|
| Core           | 85%      |
| Drivers        | 80%      |
| Schema         | 90%      |
| Model          | 85%      |
| CLI            | 75%      |
| Exceptions     | 95%      |

### Continuous Integration

Tests run automatically on:

- Pull requests to `main` branch
- Pushes to `main` branch
- Release builds

The CI pipeline runs:

1. `npm install`
2. `npm run build`
3. `npm test`
4. `npm run test:manual`

### Debugging Tests

```bash
# Run Jest with verbose output
npm test -- --verbose

# Run a specific test with debugger
npm test -- --inspect-brk tests/PostgreSQLDriver.test.ts

# Run tests with coverage report
npm test -- --coverage
```