# @yuno-payments/yuno-mcp

> MCP server exposing the Yuno API as Model Context Protocol (MCP) tools

This package provides an MCP server that exposes the Yuno payment platform API as Model Context Protocol tools, enabling programmatic access for AI agents, automation, and advanced workflows.

## Features

- Exposes Yuno API endpoints as MCP tools
- Enables AI and automation workflows with Yuno
- TypeScript support
- Easy integration with [Cursor](https://www.cursor.so/) and other MCP-compatible agents

---

## Using with Cursor or Claude Desktop

You can use this MCP server with [Cursor](https://www.cursor.so/) or [Claude Desktop](https://www.anthropic.com/claude) to enable AI-driven payment flows, customer creation, and more.

### 1. Build the Project

Clone this project and build it locally:

```bash
git clone https://github.com/yuno-payments/yuno-mcp.git
cd yuno-mcp
npm install
npm run build
```

### 2. Set Up Your Yuno API Credentials

- Set your Yuno API credentials using environment variables (see config examples below).

### 3. Add the MCP Server to Cursor

1. Open Cursor Settings (`Cmd+Shift+P` → "Cursor Settings").
2. Go to the "MCP" section and click "Add new global MCP server".
3. Add the following config (replace the path with your actual build output):

```json
{
  "mcpServers": {
    "yuno-mcp": {
      "type": "command",
      "command": "node @yuno-payments/yuno-mcp",
      "env": {
        "YUNO_ACCOUNT_CODE": "your_account_code",
        "YUNO_PUBLIC_API_KEY": "your_public_api_key",
        "YUNO_PRIVATE_SECRET_KEY": "your_private_secret_key",
        "YUNO_COUNTRY_CODE": "your_country_code",
        "YUNO_CURRENCY": "your_currency"
      }
    }
  }
}
```

### 4. Add the MCP Server to Claude Desktop

1. Open Claude Desktop settings → "Developer" tab → Edit Config.
2. Add the following config:

```json
{
  "mcpServers": {
    "yuno-mcp": {
      "command": "node",
      "args": [
        "@yuno-payments/yuno-mcp"
      ],
      "env": {
        "YUNO_ACCOUNT_CODE": "your_account_code",
        "YUNO_PUBLIC_API_KEY": "your_public_api_key",
        "YUNO_PRIVATE_SECRET_KEY": "your_private_secret_key",
        "YUNO_COUNTRY_CODE": "your_country_code",
        "YUNO_CURRENCY": "your_currency"
      }
    }
  }
}
```

### 5. Test the Integration

- In Cursor or Claude, select a Markdown file or chat and ask the agent to create a payment, customer, or checkout session using the `yuno-mcp` tool.
- Make sure your environment variables are set correctly.

---

**Required environment variables:**

- `YUNO_ACCOUNT_CODE`
- `YUNO_PUBLIC_API_KEY`
- `YUNO_PRIVATE_SECRET_KEY`
- `YUNO_COUNTRY_CODE` (optional)
- `YUNO_CURRENCY` (optional)

---

## Support

For issues, bugs, or feature requests, please [open an issue](https://github.com/yuno-payments/yuno-mcp/issues) in our GitHub repository. For official Yuno support, please visit [Yuno's official documentation](https://docs.yuno.com). 
