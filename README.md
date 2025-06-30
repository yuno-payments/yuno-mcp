# @yuno-payments/yuno-mcp

> MCP server exposing the Yuno API as Model Context Protocol (MCP) tools

This package provides an MCP server that exposes the Yuno payment platform API as Model Context Protocol tools, enabling programmatic access for AI agents, automation, and advanced workflows.

https://github.com/user-attachments/assets/8f41f3d7-5c52-4d8c-a5fd-681d6ab54b75

## Features

- Exposes Yuno API endpoints as MCP tools
- Enables AI and automation workflows with Yuno
- TypeScript support
- Easy integration with [Cursor](https://www.cursor.so/) and other MCP-compatible agents

## Available Tools

The Yuno MCP server exposes the following tools for AI agents and automation:

| Tool Name | Description |
|-----------|-------------|
| `customer.create` | Create a new customer |
| `customer.retrieve` | Retrieve a customer by ID |
| `customer.retrieveByExternalId` | Retrieve a customer by external id (merchant_customer_id) |
| `customer.update` | Update an existing customer by ID |
| `paymentMethod.enroll` | Enroll or create payment method for a customer. |
| `paymentMethod.retrieve` | Retrieve payment method. |
| `paymentMethod.retrieveEnrolled` | Retrieve all enrolled payment methods for a customer. |
| `paymentMethod.unenroll` | Unenroll payment method. |
| `checkoutSession.create` | Create a checkout session |
| `checkoutSession.retrievePaymentMethods` | Retrieve payment methods for checkout |
| `payments.create` | Create a payment with various workflows |
| `payments.retrieve` | Retrieve payment information |
| `payments.retrieveByMerchantOrderId` | Retrieve payment(s) by merchant_order_id |
| `payments.refund` | Refund a payment (full or partial) by payment and transaction id |
| `payments.cancelOrRefund` | Cancel or refund a payment by payment id (auto-detects action) |
| `payments.cancelOrRefundWithTransaction` | Cancel or refund a payment by payment and transaction id (auto-detects action) |
| `payments.cancel` | Cancel a pending payment by payment and transaction id |
| `payments.authorize` | Authorize a payment (capture: false) |
| `payments.captureAuthorization` | Capture a previously authorized payment |
| `paymentLinks.create` | Create a new payment link |
| `paymentLinks.retrieve` | Retrieve a payment link by ID |
| `paymentLinks.cancel` | Cancel a payment link by ID |
| `subscriptions.create` | Create a new subscription |
| `subscriptions.retrieve` | Retrieve a subscription by ID |
| `subscriptions.pause` | Pause a subscription by ID |
| `subscriptions.resume` | Resume a subscription by ID |
| `subscriptions.update` | Update a subscription by ID |
| `subscriptions.cancel` | Cancel a subscription by ID |
| `recipients.create` | Create a new recipient |
| `recipients.retrieve` | Retrieve a recipient by ID |
| `recipients.update` | Update a recipient by ID |
| `recipients.delete` | Delete a recipient by ID |
| `recipients.createOnboarding` | Create onboarding for a recipient |
| `installmentPlans.create` | Create a new installment plan |
| `installmentPlans.retrieve` | Retrieve an installment plan by ID |
| `installmentPlans.retrieveAll` | Retrieve all installment plans for an account |
| `installmentPlans.update` | Update an installment plan by ID |
| `installmentPlans.delete` | Delete an installment plan by ID |
| `documentation.read` | Access Yuno API documentation and guides |

### Payment Workflows

The `payments.create` tool supports three workflow types:
- **`DIRECT`** - Direct payment processing
- **`REDIRECT`** - Redirect-based payment flow
- **`SDK_CHECKOUT`** - Requires `checkout_session_id` and `ott` (for web, android, and ios payments)
---

## Using with Cursor or Claude Desktop

You can use this MCP server with [Cursor](https://www.cursor.so/) or [Claude Desktop](https://www.anthropic.com/claude) to enable AI-driven payment flows, customer creation, and more.

### 1. Set Up Your Yuno API Credentials

- Set your Yuno API credentials using environment variables (see config examples below).

### 2. Add the MCP Server to Cursor

1. Open Cursor Settings (`Cmd+Shift+P` → "Cursor Settings").
2. Go to the "MCP" section and click "Add new global MCP server".
3. Add the following config (replace the path with your actual build output):

```json
{
  "mcpServers": {
    "yuno-mcp": {
      "type": "command",
      "command": "npx @yuno-payments/yuno-mcp@latest",
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

### 3. Add the MCP Server to Claude Desktop

1. Open Claude Desktop settings → "Developer" tab → Edit Config.
2. Add the following config:

```json
{
  "mcpServers": {
    "yuno-mcp": {
      "command": "npx",
      "args": [
        "@yuno-payments/yuno-mcp@latest"
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

### 4. Test the Integration

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
