# DynamoDB — CDK implementation handoff

## Context

This is a billing automation app for an event ticketing business. Two founders use it to trigger payouts to event organizers after events finish. The app is a Next.js app hosted on Vercel, using server actions for all backend logic. There is no separate Lambda or API layer — the AWS SDK is called directly from Next.js server actions.

**External services involved:**
- **Vivenu** — source of truth for events and sales data (read only)
- **Qonto** — creates invoices and initiates SEPA transfers
- **Resend** — sends transactional emails
- **WorkOS** — authentication (founders only, no public users)
- **S3** — stores invoice PDFs (separate from this CDK stack, but referenced here)

---

## Tables to create

### 1. `Organizers`

One row per organizer. The `organizerid` matches the attribute stored on Vivenu events, making it the universal join key across all systems.

**Primary key**
| Key | Field | Type |
|-----|-------|------|
| PK | `organizerid` | String |

No sort key — one item per organizer.

**Attributes**

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `organizerid` | String | No | PK. Must match Vivenu organizer attribute exactly |
| `name` | String | No | Legal name printed on invoice header |
| `first_name` | String | No | Legal name printed on invoice header |
| `last_name` | String | No | Legal name printed on invoice header |
| `email` | String | No | Used by Resend for invoice + payout notifications |
| `billing_address` | Map | No | Keys: `street_address`, `city`, `zip_code`, `country` |
| `vat_number` | String | No | Value Added Tax number of the client (a legal entity) that needs to pay the invoice. |
| `tax_identification_number` | String | No | Tax Identification Number (TIN) of the client (Steuernummer) |
| `tax_rate` | Number | No | Integer, e.g. `19` for 19% |
| `iban` | String | No | SEPA transfer target |
| `bic` | String | No | Required by Qonto for SEPA beneficiary creation |
| `qonto_client_id` | String | Yes | Null until first billing. Written back after Qonto client is created |
| `qonto_beneficiary_id` | String | Yes | Null until first payout. Written back after Qonto beneficiary is created |
| `fee_override` | Map | Yes | Keys: `pct_rate` (Number), `per_ticket` (Number, cents), `flat` (Number, cents). Overrides platform defaults when present |
| `status` | String | No | `ACTIVE` or `INACTIVE` |
| `created_at` | String | No | ISO 8601 |
| `updated_at` | String | No | ISO 8601. Update on every write |

**No GSIs needed on this table.** All reads are by `organizerid` (GetItem or BatchGetItem).

---

### 2. `BillingRecords`

One row per event billing cycle. A row is only created when a founder triggers billing — events without a row are implicitly `UNBILLED` and that status is computed in the application layer by merging Vivenu event data with DynamoDB results.

**Primary key**
| Key | Field | Type |
|-----|-------|------|
| PK | `organizerid` | String |
| SK | `event_id` | String |

**Attributes**

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `organizerid` | String | No | PK. FK to Organizers table |
| `eventid` | String | No | SK. Vivenu event ID |
| `status` | String | No | `PENDING` / `INVOICED` / `INITIATED` / `COMPLETED` / `FAILED` |
| `triggered_at` | String | No | ISO 8601. Set at row creation |
| `triggered_by` | String | No | WorkOS user ID of the founder who triggered billing |
| `event_name` | String | No | Snapshot from Vivenu at trigger time |
| `event_start_date` | String | No | ISO 8601. Snapshot from Vivenu |
| `event_end_date` | String | No | ISO 8601. Snapshot from Vivenu. Used in event list display |
| `gross_revenue` | Number | No | **Cents (integer).** Snapshot from Vivenu at trigger time |
| `ticket_count` | Number | No | Snapshot from Vivenu at trigger time |
| `fee_pct_amount` | Number | No | Cents. `gross_revenue × pct_rate` |
| `fee_per_ticket_amount` | Number | No | Cents. `ticket_count × per_ticket_rate` |
| `fee_flat_amount` | Number | No | Cents. Flat fee per event (default: `5000` = €50) |
| `total_fees` | Number | No | Cents. Sum of the three fee fields above |
| `payout_amount` | Number | No | Cents. `gross_revenue − total_fees` |
| `qonto_invoice_id` | String | Yes | Set when status advances to `INVOICED` |
| `qonto_transfer_id` | String | Yes | Set when status advances to `INITIATED` |
| `invoice_pdf_s3_key` | String | Yes | S3 object key. Set when invoice PDF is stored |
| `invoiced_at` | String | Yes | ISO 8601 |
| `initiated_at` | String | Yes | ISO 8601 |
| `completed_at` | String | Yes | ISO 8601 |
| `failed_at` | String | Yes | ISO 8601 |
| `error_message` | String | Yes | Raw error string from Qonto API or server action. Displayed in dashboard for failed records |

**Important:** all monetary values are stored as **integer cents** to avoid floating point issues. The fee calculation in the server action is:

```ts
const feeConfig = organizer.fee_override ?? {
  pct_rate: 0.10,
  per_ticket: 100,   // €1.00
  flat: 5000,        // €50.00
};
```

---

### GSIs on `BillingRecords`

#### `StatusIndex`

Used by the dashboard to query all records of a given status — primarily for the failed records view and audit log filters.

| | Field | Type |
|--|-------|------|
| PK | `status` | String |
| SK | `triggered_at` | String |
| Projection | ALL | |

Query pattern: `status = "FAILED"`, sorted by `triggered_at` descending.

#### `EventIndex`

Used to look up a billing record by `event_id` alone, without knowing `organizerid` upfront. Useful for deep-linking from Vivenu or future webhook receivers.

| | Field | Type |
|--|-------|------|
| PK | `event_id` | String |
| SK | (none) | |
| Projection | ALL | |

---

## Access patterns summary

| Pattern | Table / Index | Operation |
|---------|--------------|-----------|
| Get organizer by ID | `Organizers` base | `GetItem` |
| Get organizers for a batch of events | `Organizers` base | `BatchGetItem` |
| Create / update organizer | `Organizers` base | `PutItem` / `UpdateItem` |
| Get billing record for a specific event | `BillingRecords` base | `GetItem(PK=organizerid, SK=event_id)` |
| Get all billing records for an organizer | `BillingRecords` base | `Query(PK=organizerid)` |
| Batch-fetch billing status for event list | `BillingRecords` base | `BatchGetItem` |
| Get all failed records across organizers | `StatusIndex` | `Query(status=FAILED)` |
| Look up billing record by event ID only | `EventIndex` | `Query(event_id=x)` |
| Write new billing record at trigger | `BillingRecords` base | `PutItem` with `ConditionExpression: attribute_not_exists(event_id)` |
| Advance billing status | `BillingRecords` base | `UpdateItem` |

**Note on idempotency:** the `PutItem` for a new `BillingRecord` must use `ConditionExpression: attribute_not_exists(event_id)`. This prevents duplicate records if a founder double-triggers billing on the same event.

---

## Event list query pattern

The dashboard event list is a join across two sources. The merge happens in the server action:

1. Fetch recent finished events from Vivenu API (`start <= now`, sorted descending, paginated)
2. Extract `[{ organizerid, event_id }]` pairs from the Vivenu response
3. `BatchGetItem` on `BillingRecords` using those pairs in one round trip
4. Merge: events with no matching `BillingRecord` are given a synthetic `status: "UNBILLED"` in the response

This means you never pre-populate DynamoDB with Vivenu events. The snapshot fields (`event_name`, `event_end_date`, etc.) are only written to DynamoDB at billing trigger time.

---

## CDK stack requirements

- **Billing mode:** PAY_PER_REQUEST (on-demand). At ~20 events/month this is effectively free and requires no capacity planning.
- **Removal policy:** RETAIN on both tables for production. Never destroy billing data on stack teardown.
- **Point-in-time recovery:** enable on both tables.
- **Encryption:** use AWS managed key (default). No custom KMS key needed at this scale.
- **Table names:** use explicit names (`Organizers`, `BillingRecords`) rather than CDK-generated names so server action config stays stable across deployments. Pass them to Vercel as environment variables (`DYNAMODB_ORGANIZERS_TABLE`, `DYNAMODB_BILLING_RECORDS_TABLE`).
- **Region:** deploy to the same region as the rest of your AWS resources to avoid cross-region latency.

---

## Environment variables needed in Vercel

```
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
DYNAMODB_ORGANIZERS_TABLE=Organizers
DYNAMODB_BILLING_RECORDS_TABLE=BillingRecords
```

Create an IAM user (or preferably an IAM role with OIDC for Vercel) scoped to only the two tables. Minimum permissions needed:

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem",
    "dynamodb:Query",
    "dynamodb:BatchGetItem"
  ],
  "Resource": [
    "arn:aws:dynamodb:REGION:ACCOUNT:table/Organizers",
    "arn:aws:dynamodb:REGION:ACCOUNT:table/BillingRecords",
    "arn:aws:dynamodb:REGION:ACCOUNT:table/BillingRecords/index/*"
  ]
}
```

---

## Out of scope for this CDK stack

- S3 bucket for invoice PDFs (separate stack or add to this one — your call)
- IAM role / OIDC setup for Vercel (handle outside CDK or in a separate constructs file)
- Vivenu, Qonto, Resend, WorkOS credentials (stored in Vercel env vars, not AWS)
