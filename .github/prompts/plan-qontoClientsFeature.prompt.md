## Plan: Qonto Clients CRUD UI

Build a new banking clients area that lists Qonto clients with simple next/previous pagination, supports create via modal, and supports view-then-edit in a row-click modal. Reuse existing Qonto service/action/query patterns and beneficiary dialog/table patterns to keep architecture consistent and low-risk.

**Steps**
1. Phase 1 - Data contracts and service methods
1.1 Extend src/types/qonto/clients.ts with request/response schemas and inferred input types for retrieve/create/update endpoints. Keep ListClientsResponseSchema unchanged except where API reality requires alignment.
1.2 Extend src/lib/qonto/services/clients.ts with:
- listClients(page = 1, perPage = 50)
- retrieveClient(id)
- createClient(input)
- updateClient(id, input)
- optional helper for list with filters used by duplicate check
1.3 Add query wrappers in src/lib/qonto/queries.ts for retrieve/list clients in the same success/error envelope currently used by queryInvoices/queryBeneficiaries.
- depends on 1.1 and 1.2

2. Phase 2 - Server actions and cache strategy
2.1 Create src/actions/clients.ts with server actions:
- createClient(input)
- updateClient(id, input)
- checkClientDuplicates(input) using /clients list filters (name/email/vat/tax)
2.2 Apply existing error mapping pattern from src/actions/beneficiaries.ts (AppError-aware fallback messages) and call revalidatePath for /banking/clients and /banking/invoices after mutations.
- depends on 1.x

3. Phase 3 - Clients route and list UX
3.1 Add src/app/(authenticated)/banking/clients/page.tsx as server component that:
- reads searchParams.page
- calls queryClients(page)
- renders QontoConnectCard for auth errors
- renders error card for non-auth failures
- passes clients + meta to manager component
3.2 Create src/app/(authenticated)/banking/clients/ClientsManager.tsx as client component:
- table columns (name/kind/email/currency/updated_at)
- row click opens detail modal
- header create button opens create modal
- simple next/previous controls wired to router query page
- depends on 2.x for mutations and 3.1 for data

4. Phase 4 - Modal forms (create + view/edit)
4.1 Create src/components/forms/ClientForm.tsx reusable controlled form for selected editable field groups:
- Core identity, Contact, Billing address, Delivery address, Tax and legal, Invoicing prefs
4.2 Create src/components/forms/ClientCreateDialog.tsx:
- opens from manager header button
- runs duplicate pre-check before submit
- creates client via server action
- success toast + refresh + close
4.3 Create src/components/forms/ClientDetailDialog.tsx:
- opens on row click in read-only mode first
- Edit button toggles editable state
- Save triggers update action
- cancel resets unsaved edits
- depends on 4.1 and 2.x

5. Phase 5 - Navigation and integration
5.1 Update src/components/app-sidebar.tsx by adding Clients under banking entries (same flat nav style).
5.2 Optional small refactor in src/app/(authenticated)/banking/invoices/page.tsx only if needed to keep revalidation and clients consumption behavior coherent.
- parallel with 4.x except for any shared types import constraints

6. Phase 6 - Validation and hardening
6.1 Add/adjust schema tests (if present patterns are practical) for client payload parsing and action-level error mapping.
6.2 Manual UX verification for modal transitions, duplicate warning path, pagination boundaries, and auth/error states.
- depends on all prior phases

**Relevant files**
- src/types/qonto/clients.ts - extend with create/update/retrieve schemas and payload types
- src/types/qonto/shared.ts - confirm meta key compatibility (previous_page handling)
- src/lib/qonto/services/clients.ts - add retrieve/create/update/list filter capabilities
- src/lib/qonto/queries.ts - add queryClient/queryClients variants used by clients page and modal
- src/actions/clients.ts - new server actions and duplicate check flow
- src/app/(authenticated)/banking/clients/page.tsx - new page entry and server-side state handling
- src/app/(authenticated)/banking/clients/ClientsManager.tsx - table, pagination, row-click modal orchestration
- src/components/forms/ClientForm.tsx - reusable create/edit form component
- src/components/forms/ClientCreateDialog.tsx - create flow with duplicate pre-check
- src/components/forms/ClientDetailDialog.tsx - read-only first, then edit/update
- src/components/app-sidebar.tsx - add navigation item
- src/app/(authenticated)/banking/invoices/page.tsx - verify compatibility with clients revalidation usage

**Verification**
1. Run typecheck/lint and ensure new client service/action signatures are valid across imports.
2. Validate list page: /banking/clients loads data, next/previous page works, and disables controls at bounds using meta current_page/next_page/previous_page.
3. Validate create flow: open create modal, duplicate check triggers for known duplicate candidate, non-duplicate creates successfully, list refreshes.
4. Validate row flow: click row opens detail modal read-only; Edit toggles form; Save persists updates and reflects in list.
5. Validate failure modes: expired Qonto auth shows QontoConnectCard; API validation errors show user-facing toast/error text.
6. Regression check: invoice page still loads clients for invoice creation and sidebar links remain correct.

**Decisions**
- Included scope: list + create + update for Qonto clients with modal-based interactions.
- Included UX choices: simple next/previous pagination; row opens modal in read-only mode; clients nav under banking; duplicate check before create.
- Editable fields included: core identity, contact, billing/delivery addresses, tax/legal, invoicing prefs.
- Excluded for now: delete client flow, advanced filtering/sorting UI, infinite scroll, nav-group redesign.

**Further Considerations**
1. Duplicate-check strictness recommendation: block creation when exact email/tax/vat match, but only warn (not block) for name-only partial matches.
2. Locale normalization recommendation: normalize to lowercase language code before submit to avoid inconsistent values in table and form.
3. API drift guard recommendation: confirm Qonto meta key naming at runtime (prev_page vs previous_page) and add parser fallback if needed.
