# Split Expenses — Design Spec

## Overview

Add expense splitting between household members with balance tracking and settlement transactions. Supports equal splits, custom amounts, and configurable default ratios per household.

## Constraints

- Splits can only be created on `EXPENSE` transactions. `INCOME` and `SETTLEMENT` transactions cannot be split.
- `SETTLEMENT` transactions are excluded from all financial calculations (summary, budget, insights, annual chart, tag summary, recent transactions on dashboard).

## Data Model

### New Tables

**Split** — Links a transaction to its division among members.

| Field         | Type     | Notes                                       |
|---------------|----------|---------------------------------------------|
| id            | cuid     | PK                                          |
| transactionId | String   | FK → Transaction, unique (1:1), onDelete: Cascade |
| createdAt     | DateTime | default now()                               |

Relations: `shares: SplitShare[]`, `transaction: Transaction`

**SplitShare** — One member's portion of a split.

| Field   | Type   | Notes                                          |
|---------|--------|------------------------------------------------|
| id      | cuid   | PK                                             |
| splitId | String | FK → Split, onDelete: Cascade                  |
| userId  | String | FK → User                                      |
| amount  | Int    | Value in cents this member owes                |

Constraint: `@@unique([splitId, userId])`

Invariants:
- Sum of all `SplitShare.amount` for a split must equal `Transaction.amount`.
- The payer (Transaction.userId) ALWAYS has a SplitShare for their own portion.

### Altered Models

**Household** — New optional field:
- `defaultSplitRatio: Json?` — e.g. `{ "userId1": 60, "userId2": 40 }`. Null means equal split.
- Validation: values must be integers summing to 100, all userIds must be current household members.
- When a member is added/removed, `defaultSplitRatio` is reset to null (equal split).

**Transaction** — New optional fields for settlements:
- `categoryId: String?` — changed from required to optional. Null for SETTLEMENT transactions only. All existing queries already filter by type or join category, so this is safe.
- `settlementFromId: String?` — FK → User (who paid the settlement). For SETTLEMENT transactions, must equal `userId`.
- `settlementToId: String?` — FK → User (who received the settlement)
- `split: Split?` — reverse relation

**TransactionType** — New enum value:
- `SETTLEMENT` — excluded from all financial queries.

**User** — New relations:
- `splitShares: SplitShare[]`
- `settlementsFrom: Transaction[] @relation("settlementFrom")`
- `settlementsTo: Transaction[] @relation("settlementTo")`

## Balance Calculation

Between members A and B:

```
A owes B = sum of SplitShare.amount for A in transactions paid by B
           (excluding shares where userId == transaction.userId, i.e. the payer's own share)
B owes A = sum of SplitShare.amount for B in transactions paid by A
           (same exclusion)
Settlements A→B = sum of SETTLEMENT transactions where settlementFromId=A, settlementToId=B
Settlements B→A = sum of SETTLEMENT transactions where settlementFromId=B, settlementToId=A

Net balance of A with B = (A owes B) - (B owes A) - (Settlements A→B) + (Settlements B→A)
```

Positive = A owes B. Negative = B owes A.

Calculated on-demand via server action. Query shape: `SplitShare JOIN Split JOIN Transaction` filtered by `Transaction.householdId`. Trivial for households of 2-4 members.

## Interaction Flows

### Creating a Split (in transaction form)

1. User creates/edits transaction normally (type must be EXPENSE)
2. Toggle "Dividir despesa" expands split section
3. Members pre-selected with household default ratio (or equal if not configured)
4. User can adjust amount/percentage per member or remove members
5. Validation: share amounts must sum to transaction total
6. Save creates Transaction + Split + SplitShares in a DB transaction

### Creating a Split (after the fact)

1. EXPENSE transaction without split shows "Dividir" button in the list
2. Opens modal with same split UI
3. Saves Split + SplitShares linked to existing transaction

### Editing a Split

1. Transaction with existing split shows a split icon and "Editar divisao" action
2. Opens modal pre-filled with current shares
3. User adjusts amounts, saves updates

### Updating a Transaction with an Existing Split

When a transaction amount changes and it has a split, the split is deleted. The user must re-split manually. This is enforced in `updateTransaction`: if amount changes and a split exists, delete the split and notify via return value.

### Settling Debt

1. On `/splits` page or dashboard card, user sees "Voce deve R$150 a Fulano"
2. "Acertar" button opens modal with pre-filled amount (adjustable for partial settlement)
3. Validation: amount must be > 0 and <= current balance owed
4. Confirming creates a Transaction with `type: SETTLEMENT`, `settlementFromId = userId`, `settlementToId`, `categoryId: null`
5. Settlement appears in transaction history and splits page

### Configuring Default Ratio

1. On `/household` page, section "Proporcao padrao de divisao"
2. Sliders or inputs per member, summing to 100%
3. Saves to `Household.defaultSplitRatio`

## Server Actions

### New (`src/lib/actions/splits.ts`)

- `getBalance()` — calculates net balance between all household member pairs. Query joins SplitShare → Split → Transaction, filtered by householdId.
- `getSplits(month?)` — lists transactions with splits, filterable by month
- `getSettlements(month?)` — lists settlement transactions between members
- `createSplit(transactionId, shares[])` — creates split on existing EXPENSE transaction. Authorization: joins through Transaction to verify householdId.
- `updateSplit(splitId, shares[])` — updates shares on existing split. Authorization: joins Split → Transaction → householdId.
- `createSettlement(toUserId, amount)` — creates settlement transaction with `categoryId: null`
- `deleteSplit(splitId)` — removes split from a transaction. Authorization: joins Split → Transaction → householdId. Revalidates `/splits`, `/dashboard`, `/transactions`.

### Modified

- `createTransaction` / `updateTransaction` — accept optional `shares[]` to create split inline. If `updateTransaction` changes amount on a transaction with existing split, the split is deleted.
- All queries that aggregate financial data must exclude SETTLEMENT:
  - `getMonthlySummary` — add `type: { not: "SETTLEMENT" }` filter
  - `getRecentTransactions` — add `type: { not: "SETTLEMENT" }` filter
  - `getInsights` — add `type: { not: "SETTLEMENT" }` filter
  - `getBudgets` — already scoped by category, but add filter for safety
  - `getTagSummary` — add `type: { not: "SETTLEMENT" }` filter
  - `getTransactions` — exclude SETTLEMENT from default listing, add as filter option if needed
  - `getAnnualSummary` — already filters by type in raw SQL, safe
- All transaction mutation actions (`createTransaction`, `updateTransaction`, `deleteTransaction`, `createSplit`, `updateSplit`, `deleteSplit`, `createSettlement`, `toggleOccurrencePaid`) must include `revalidatePath("/splits")`.
- `deleteTransaction` — Prisma `onDelete: Cascade` on Split handles cleanup automatically.

## Validation

### `src/lib/validations/split.ts`

- `splitShareSchema`: `{ userId: string, amount: string | number }`
- `splitSchema`: array of `splitShareSchema`, validated that sum matches transaction total. Transaction must be type EXPENSE.
- `settlementSchema`: `{ toUserId: string, amount: string }`. Amount must be > 0 and <= balance owed.
- `defaultSplitRatioSchema`: `Record<string, number>`, values must be integers summing to 100, all keys must be valid household member userIds.

## Components

### New

- `split-section.tsx` — split UI inside transaction form (toggle + member list + value inputs). Only shown for EXPENSE type.
- `split-button.tsx` — "Dividir" button on transaction list for un-split EXPENSE transactions, opens modal with split-section
- `split-badge.tsx` — split icon/indicator on transactions that already have a split, with "Editar divisao" and "Remover divisao" actions
- `split-balance-card.tsx` — dashboard card showing balance between members
- `splits-page.tsx` — content for `/splits` route (summary + split list + settlements)
- `settlement-dialog.tsx` — modal to register a settlement

### New Route

- `src/app/(app)/splits/page.tsx` + `loading.tsx`
- "Divisoes" item added to sidebar navigation

## Indexes

- `SplitShare.userId` — for balance queries
- `Transaction.settlementFromId` — for settlement lookups
- `Transaction.settlementToId` — for settlement lookups

## Edge Cases

- **Member removed from household**: their shares remain for historical accuracy. Balance with removed member is frozen (no new splits possible). `defaultSplitRatio` is reset to null.
- **Transaction deleted**: `onDelete: Cascade` on Split deletes Split and SplitShares automatically. Balance recalculates.
- **Split deleted**: only removes the split, transaction remains intact.
- **Transaction amount updated with existing split**: split is deleted, user must re-split.
- **Settlement exceeds balance**: validation prevents settling more than owed.
- **Partial settlement**: allowed — balance updates proportionally.
- **Recurring transaction with split**: split is per-occurrence (each paid occurrence can have its own split). The split section appears after marking as paid.
- **SETTLEMENT in existing queries**: filtered out everywhere via `type: { not: "SETTLEMENT" }`.
- **SETTLEMENT and categoryId**: settlements have `categoryId: null`. All category-dependent queries already filter by type or inner-join category, so null is safe.
- **Split on non-EXPENSE**: validation rejects. Only EXPENSE transactions can be split.
- **defaultSplitRatio stale after membership change**: ratio is reset to null (equal split) when members are added/removed.
