# Qonto Billing Tool

An internal Next.js application for managing post-event billing and integrating with Qonto for invoice creation and SEPA transfers.

## Features

- **Qonto OAuth Authentication** — Users authenticate using their Qonto accounts
- **Invoice Management** — Create and list client invoices directly in Qonto
- **SEPA Transfers** — Initiate money transfers to pre-configured beneficiaries
- **Server-Side Security** — All Qonto API calls and tokens handled server-side only
- **Type-Safe** — Full TypeScript support with Zod validation for API responses

## Tech Stack

- **Next.js 15+** (App Router, Server Components, Server Actions)
- **TypeScript** — Strict mode for type safety
- **Tailwind CSS** — Utility-first CSS framework
- **Shadcn/UI** — High-quality React components
- **Zod** — Schema validation
- **Biome** — Fast formatter and linter
- **Lucide Icons** — Beautiful icon library

## Getting Started

### Prerequisites

- Node.js 18+ (check with `node --version`)
- npm (or your preferred package manager)
- Qonto developer account (https://developers.qonto.com/)

### Setup

1. **Clone and install dependencies:**
   ```bash
   cd /Users/maerzd/Projects/ticketing-billing
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```

3. **Get Qonto credentials:**
   - Go to [https://developers.qonto.com](https://developers.qonto.com)
   - Create a new application
   - Note your `client_id` and `client_secret`
   - Set your redirect URI to `http://localhost:3000/api/qonto/auth/callback` (for development)

4. **Update `.env.local`:**
   ```
   NEXT_PUBLIC_QONTO_CLIENT_ID=your_client_id
   NEXT_PUBLIC_QONTO_REDIRECT_URI=http://localhost:3000/api/qonto/auth/callback
   QONTO_CLIENT_SECRET=your_client_secret
   QONTO_SANDBOX=true
   QONTO_ORGANIZATION_ID=1acf250c-a068-47fa-ae9d-032b85c148dc
   QONTO_REGISTRATION_ID=a584b060-8c96-488d-8bbb-74f0d3d2803c
   ```

   > **Note:** To generate a random secret, you can run: `openssl rand -base64 32`

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                       # Next.js App Router
│   ├── api/                  # API routes
│   │   └── qonto/
│   │       └── auth/        # Qonto OAuth authentication endpoints
│   ├── auth/                # Main app auth endpoints (WorkOS)
│   ├── dashboard/           # Dashboard page
│   ├── invoices/            # Invoice management
│   ├── transfers/           # Transfer management
│   └── login/               # Login page
├── actions/                  # Server Actions for data mutations
├── components/
│   ├── forms/               # Form components (InvoiceForm, TransferForm)
│   ├── layout/              # Layout components (Header)
│   └── ui/                  # Shadcn UI components
├── lib/
│   ├── qonto/              # Qonto API integration
│   │   ├── oauth.ts        # OAuth flow helpers
│   │   ├── client.ts       # Qonto API client
│   │   └── services/       # API service classes
│   ├── auth.ts             # Authentication utilities
│   └── errors.ts           # Custom error classes
├── types/                   # TypeScript types (Qonto API schemas)
└── env.ts                  # Environment variable validation
```

## How It Works

### Authentication Flow

1. **Login** → User clicks "Login with Qonto" button
2. **OAuth Consent** → Redirected to Qonto's consent screen
3. **Token Exchange** → Authorization code exchanged for access/refresh tokens
4. **Secure StorageToken** → Tokens stored in HTTP-only secure cookies
5. **Authenticated Requests** → Subsequent API calls use the stored token

### Creating Invoices

1. User fills in invoice form (client name, amount, description, dates)
2. Server Action validates input with Zod
3. Qonto API called to create invoice
4. User redirected to invoices list

### Creating Transfers

1. User selects pre-configured beneficiary from dropdown
2. Enters amount, description, and optional reference
3. Server Action initiates SEPA transfer via Qonto API
4. Transfer appears in transfer history

## Available Scripts

- **`npm run dev`** — Start development server (http://localhost:3000)
- **`npm run build`** — Build for production
- **`npm run start`** — Run production build
- **`npm run lint`** — Check with Biome linter
- **`npm run format`** — Format code with Biome formatter

## Environment Variables

| Variable                      | Required | Description |
|-------------------------------|----------|-------------|
| `NEXT_PUBLIC_QONTO_CLIENT_ID` | Yes      | OAuth client ID from Qonto |
| `NEXT_PUBLIC_QONTO_REDIRECT_URI` | Yes   | OAuth redirect URL |
| `QONTO_CLIENT_SECRET`         | Yes      | OAuth client secret (server-side only) |
| `QONTO_SANDBOX`               | No       | Use sandbox environment (default: true) |
| `QONTO_ORGANIZATION_ID`       | No       | Restricts OAuth to one Qonto organization |
| `QONTO_REGISTRATION_ID`       | No       | Pre-selects organization from onboarding registration |

> **Security Note:** `QONTO_CLIENT_SECRET` should never be public. Keep it in `.env.local` and never commit to Git.

## Deployment to Vercel

1. **Push code to Git:**
   ```bash
   git push origin main
   ```

2. **Connect Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables from `.env.local` to Vercel project settings

3. **Update Qonto redirect URI:**
   - Navigate to [https://developers.qonto.com](https://developers.qonto.com)
   - Update authorized redirect URIs to include your Vercel domain:
   - Production: `https://your-project.vercel.app/api/qonto/auth/callback`
   - Preview: `https://your-project-*.vercel.app/api/qonto/auth/callback`

4. **Deploy:**
   ```bash
   git push origin main  # Automatically deploys to Vercel
   ```

## API Endpoints

### Authentication

- `GET /api/qonto/auth/login` — Initiates Qonto OAuth flow
- `GET /api/qonto/auth/callback` — OAuth callback (exchanges code for tokens)
- `GET /api/qonto/auth/logout` — Clears authentication and redirects to login

### Data (Server Actions)

- `createInvoice(input)` — Creates a new client invoice
- `getInvoices(page)` — Fetches paginated invoice list
- `createTransfer(input)` — Creates a SEPA transfer
- `getTransfers(page)` — Fetches paginated transfer list
- `getBeneficiaries(page)` — Fetches SEPA beneficiaries
- `getOrganization()` — Retrieves organization details

## Troubleshooting

### "No authentication tokens found"
- Ensure you've completed the login flow
- Check that cookies are enabled in your browser
- Clear browser cache and try logging in again

### "Qonto API error: 401"
- Your access token may have expired
- Try logging out and logging back in
- Check that `QONTO_SANDBOX` environment variable matches your Qonto environment

### "OAuth code expired"
- Authorization code is valid for 10 minutes
- Ensure your system clock is correct
- Try the login flow again

### Build fails with TypeScript errors
- Run `npm run format` to fix formatting issues
- Check that all environment variables are set in `.env.local`
- Delete `.next` folder and rebuild: `rm -rf .next && npm run build`

## Next Steps

1. **Migrate billing logic** — Copy event revenue calculation and fee logic from your existing project
2. **Add webhook support** — Listen for Qonto events (invoices paid, transfers completed)
3. **Implement audit logging** — Track who created what and when
4. **Add role-based access** — Restrict certain users to specific actions
5. **Set up monitoring** — Monitor API errors and performance metrics

## Resources

- [Qonto API Documentation](https://docs.qonto.com/api-reference/business-api)
- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn/UI Components](https://ui.shadcn.com)
- [Zod Validation Library](https://zod.dev)

## Support

For issues with the Qonto API, check their [documentation](https://docs.qonto.com/api-reference/business-api). For Next.js-specific questions, refer to their [docs](https://nextjs.org/docs).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
