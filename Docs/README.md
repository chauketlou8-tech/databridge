# DataBridge Documentation

This directory contains the documentation website for DataBridge.

## Structure

```
docs/
├── index.html              # Homepage
├── getting-started/        # Getting started guides
│   ├── installation.html   # Installation instructions
│   └── quick-start.html    # Quick start guide
├── api/                    # API reference
│   ├── connection.html     # Connection API
│   ├── models.html         # Models API
│   └── queries.html        # Query API
├── guides/                 # Database guides
│   ├── postgres.html       # PostgreSQL guide
│   ├── mysql.html          # MySQL guide
│   ├── mongodb.html        # MongoDB guide
│   └── sqlite.html         # SQLite guide
└── assets/
    └── style.css           # Stylesheet
```

## Development

To view the documentation locally, open `index.html` in your browser.

```bash
open index.html
```

## Building

No build step required. This is a static HTML site.

## Contributing

To add or update documentation:

1. Edit the relevant HTML file
2. Keep the same style and structure
3. Test locally by opening the file in a browser
4. Submit a pull request

## License

MIT