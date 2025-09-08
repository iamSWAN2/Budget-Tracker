# Changelog

All notable changes to this project will be documented in this file.

## [v0.2.0] - 2025-09-08

- Dashboard
  - Restore Asset Distribution chart and place it to the right of Transaction History (2+1 layout on lg/xl)
  - Fix Asset Distribution to a stable, fixed height on desktop; avoid dynamic stretching
  - Unify top summary into a single strip and add subtle section colors (Total / Income / Expense)
  - Transaction table: prioritize date display (first column), add installment badges (e.g., "할부 N개월") without adding new columns
  - Mobile transaction cards: show date badge first and installment chip below description
- Transactions Page
  - Same date-first order and installment badge styling as dashboard
- UI
  - Correct React `autoComplete` prop casing in TransactionForm
  - Card component supports full-height layout where needed
- Misc
  - Header: add missing Settings title
  - General layout tidy-ups and minor styling improvements

[v0.2.0]: https://github.com/iamSWAN2/Budget-Tracker/releases/tag/v0.2.0

