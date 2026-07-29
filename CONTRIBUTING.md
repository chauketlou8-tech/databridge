# Contributing to DataBridge

First off, thank you for considering contributing to DataBridge. It's people like you that make DataBridge such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by the DataBridge Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps which reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed after following the steps
- Explain which behavior you expected to see instead and why
- Include screenshots if possible

### Suggesting Enhancements

If you have a suggestion for DataBridge, we'd love to hear it. Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- Use a clear and descriptive title
- Provide a step-by-step description of the suggested enhancement
- Provide specific examples to demonstrate the steps
- Describe the current behavior and explain which behavior you expected to see instead
- Explain why this enhancement would be useful

### Your First Code Contribution

Unsure where to begin contributing to DataBridge? You can start by looking through these beginner-friendly issues:

- [Good first issues](https://github.com/yourusername/databridge/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [Help wanted issues](https://github.com/yourusername/databridge/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)

### Pull Requests

Please follow these steps to have your contribution considered by the maintainers:

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes
4. Run the tests
5. Commit your changes with a descriptive commit message
6. Push your branch to your fork
7. Open a pull request

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup

```bash
git clone https://github.com/your-username/databridge.git
cd databridge
npm install
```

### Running Tests

```bash
npm test
```

### Building the Project

```bash
npm run build
```

### Running in Development Mode

```bash
npm run dev
```

## Style Guidelines

### TypeScript Style Guide

- Use TypeScript strict mode
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Use interfaces over types when possible
- Avoid using `any` type

## Adding a New Database Driver

1. Create a new directory under `drivers/`
2. Implement the driver interface
3. Add tests for your driver
4. Update the documentation

### Driver Interface

```typescript
interface DatabaseDriver {
    connect(config: ConnectionConfig): Promise<void>;
    disconnect(): Promise<void>;
    create(model: string, data: any): Promise<any>;
    find(model: string, query: Query): Promise<any[]>;
    findOne(model: string, query: Query): Promise<any>;
    update(model: string, filter: any, data: any): Promise<any>;
    delete(model: string, filter: any): Promise<any>;
}
```

## Documentation

If you're adding or changing functionality, please update the documentation accordingly. This includes:

- README.md for high-level changes
- JSDoc comments for API changes
- Examples for new features

## License

By contributing to DataBridge, you agree that your contributions will be licensed under its MIT license.