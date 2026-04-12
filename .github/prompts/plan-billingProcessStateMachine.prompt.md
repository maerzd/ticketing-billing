## Plan: Billing Process State Machine with DynamoDB Persistence

Persist every step of the event billing lifecycle (draft → finalize → email → payout) in the BillingRecordsTable using a three-status-field design: `invoiceStatus`, `payoutStatus`, and a derived `billingStatus` (for efficient GSI queries). Add SevDesk endpoints (update, finalize, getPdf), a Resend email integration, and a DynamoDB BillingRecordsService. Refactor the invoice UI into a state-driven workflow. Surface billing status in the events table and event detail page.

---

### Phase 1: Data Layer — Types, CDK, DynamoDB Service

**Step 1.1: Define BillingRecord schema** — Create `packages/types/src/ddb/billing-records.ts`
- Keys: `organizerId` (PK), `eventId` (SK)
- Identity: `eventName`, `organizerName`
- `invoiceStatus`: `DRAFT | OPEN | SENT | PAID | VOID`
- `payoutStatus`: `PENDING | INITIATED | COMPLETED | FAILED`
- `billingStatus`: `PENDING | IN_PROGRESS | COMPLETED | ATTENTION_NEEDED` *(derived, computed before every write)*
- Service refs: `sevdeskInvoiceId`, `sevdeskInvoiceNumber`, `qontoTransferId`
- Settings snapshot: `eventTaxRate`, `setupFee` (cents), `ticketCommissionRate`, `officialPos` (string[])
- Financials (all cents): `totalRevenueCents`, `invoiceAmountCents`, `invoiceNetCents`, `payoutAmountCents`, `ticketsCount`, `revenueOrganizerCents`
- Timestamps: `createdAt`, `updatedAt`, `invoiceFinalizedAt?`, `emailSentAt?`, `payoutInitiatedAt?`, `payoutCompletedAt?`
- Export pure function `deriveBillingStatus(invoiceStatus, payoutStatus)` → billingStatus

**Step 1.2: Add organizer default billing settings** — Modify `packages/types/src/ddb/organizers.ts`
- Add optional: `defaultEventTaxRate?`, `defaultSetupFee?` (cents), `defaultTicketCommissionRate?`

**Step 1.3: Update CDK stack** — Modify `infra/cdk/lib/billing-dynamo-stack.ts`
- Fix EventIndex GSI: `eventid` → `eventId`
- Update StatusIndex GSI: `status` → `billingStatus`, `triggered_at` → `updatedAt`

**Step 1.4: Create BillingRecordsService** — Create `apps/web/src/lib/dynamodb/services/billing-records.ts`
- Follow `OrganizersService` class pattern
- Methods: `createBillingRecord`, `getBillingRecord`, `updateBillingRecord`, `getBillingRecordByEventId` (EventIndex), `getBillingRecordsByStatus` (StatusIndex), `batchGetBillingRecords`, `listBillingRecordsForOrganizer`

---

### Phase 2: SevDesk API Extensions

**Step 2.1: `updateInvoiceDraft()`** — Modify `apps/web/src/lib/sevdesk/services/invoices.ts`
- Reuse `POST /Invoice/Factory/saveInvoice` with `invoice.id` + `mapAll: true`
- Fetch existing positions via `GET /Invoice/{id}/getPositions`, diff, and send updates

**Step 2.2: `finalizeInvoice(invoiceId, sendDraft?)`**
- `PUT /Invoice/{invoiceId}/sendBy` with `{ sendType: "VPDF", sendDraft }`
- `sendDraft: true` = test mode (no status change); `false` = real finalization (status → 200)

**Step 2.3: `getInvoicePdf(invoiceId)`**
- `GET /Invoice/{invoiceId}/getPdf?download=true&preventSendBy=true`
- Returns `{ filename, mimeType, base64encoded, content }`

**Step 2.4: `getInvoiceById(invoiceId)`**
- `GET /Invoice/{invoiceId}` — for refreshing invoice state from SevDesk

---

### Phase 3: Resend Email Integration

**Step 3.1: Install and configure** — Add `resend` to `apps/web/package.json`, add `RESEND_API_KEY` + `RESEND_FROM_EMAIL` env vars
- Create `apps/web/src/lib/resend/client.ts` + `apps/web/src/lib/resend/services/email.ts`

**Step 3.2: `sendInvoiceEmail()`**
- Input: recipient email, organizer name, invoice number, event name, PDF base64, filename
- Compose: professional subject line, short body text, PDF attachment
- Return Resend message ID

---

### Phase 4: Server Actions — Billing Workflow

**Step 4.1: Extract billing math** — Create `apps/web/src/lib/billing-calculator.ts`
- Move fee calculation from `invoice.tsx` into pure function `calculateBillingAmounts()`
- Returns both euros (display) and cents (storage)
- Shared by UI preview and server actions

**Step 4.2: Billing server actions** — Create `apps/web/src/actions/billing.ts`

| Action | Guards | Core Flow | DDB Update |
|--------|--------|-----------|------------|
| `createBillingDraft` | No existing record | Calculate amounts → Create SevDesk draft → Create DDB record | `invoiceStatus=DRAFT`, `payoutStatus=PENDING` |
| `updateBillingDraft` | `invoiceStatus=DRAFT` | Recalculate → Update SevDesk positions → Update DDB | Updated settings + amounts |
| `finalizeBillingInvoice` | `invoiceStatus=DRAFT` | Call SevDesk `/sendBy` | `invoiceStatus=OPEN`, `invoiceFinalizedAt` |
| `sendBillingEmail` | `invoiceStatus≥OPEN` | Fetch PDF → Send via Resend | `invoiceStatus=SENT`, `emailSentAt` |
| `initiateBillingPayout` | `invoiceStatus≥OPEN`, `payoutStatus=PENDING` | Create Qonto SEPA transfer | `payoutStatus=INITIATED`, `qontoTransferId` |

Every action recomputes `billingStatus` via `deriveBillingStatus()` before writing to DDB.

---

### Phase 5: UI — Invoice Page Refactor

**Step 5.1: State-driven invoice component** — Major refactor of `apps/web/src/app/(authenticated)/events/[id]/invoice.tsx`
- Accept `billingRecord?: BillingRecord` prop
- **No record**: Show preview + "Entwurf erstellen" (current behavior, now persists to DDB)
- **DRAFT**: Editable settings form (taxRate, setupFee, commissionRate, officialPos) + "Aktualisieren" + "Rechnung finalisieren"
- **OPEN**: Read-only + "Email senden" + "Auszahlung auslösen"
- **SENT**: Sent confirmation + "Auszahlung auslösen" (if payout PENDING)
- **COMPLETED**: Full summary with all timestamps

**Step 5.2: Create billing status badge** — Create `apps/web/src/components/my-ui/billing-status-badge.tsx`
- Color coding: PENDING=gray, IN_PROGRESS=yellow, COMPLETED=green, ATTENTION_NEEDED=red

---

### Phase 6: UI — Events Table & Detail Page

**Step 6.1: Event detail page** — Modify `apps/web/src/app/(authenticated)/events/[id]/page.tsx`
- Fetch billing record via `getBillingRecordByEventId(eventId)`, pass to Invoice component
- Show billing status badge in header

**Step 6.2: Events table** — Modify `apps/web/src/app/(authenticated)/events/page.tsx` + `events-table-tabs.tsx`
- Batch-fetch billing records for all events via `batchGetBillingRecords()`
- Add "Abrechnung" column with billing status badge (UNBILLED for events without a record)

---

### Verification

1. `tsc --noEmit` across monorepo after Phase 1
2. `npx cdk synth` after Step 1.3 to validate CDK changes
3. Unit test `deriveBillingStatus()` for all status combinations
4. SevDesk sandbox: test `finalizeInvoice()` with `sendDraft: true` first
5. Resend test: send a test email with PDF attachment
6. E2E walkthrough: create draft → update → finalize → send email → trigger payout — verify DDB at each step
7. Events table: verify billing status for billed vs unbilled events
8. Idempotency: duplicate `createBillingDraft` for same event → 409

---

### Decisions

- **Three-status model**: `invoiceStatus` + `payoutStatus` + derived `billingStatus`. Dashboard queries use `billingStatus` via StatusIndex GSI.
- **Per-organizer defaults + per-event snapshot**: Organizer stores defaults; billing record snapshots them at creation. Retroactive changes don't affect existing records.
- **Finalize-before-payout**: Payout requires `invoiceStatus ≥ OPEN`.
- **officialPos**: Stored per billing record, not per organizer.
- **All monetary values in cents**: Consistent with handoff doc.
- **Only billing settings editable**: Items are recalculated programmatically from settings—no free-form item editing.

### Further Considerations

1. **Payout status polling**: Qonto transfers go through `pending → processing → settled/declined`. A manual "Refresh" button or periodic check could update `payoutStatus`. Not in initial scope but the data model supports it.
2. **Email template**: Start with plain text, iterate later. Use contactPerson name + organizer name for personalization.
3. **Batch billing**: Future "bill all past events" action could iterate unbilled events. StatusIndex supports querying by `billingStatus`.
