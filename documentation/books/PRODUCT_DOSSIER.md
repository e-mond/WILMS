# WILMS Product Dossier

**Version:** 1.7.3  
**Classification:** Confidential — Executive / Partner Distribution

---

## Executive Summary

WILMS (Women's Interest-Free Loan Management System) is a production-grade operational platform for managing women's interest-free group lending programmes. Deployed on Vercel with Neon PostgreSQL, WILMS covers the complete lending lifecycle with strong RBAC, financial integrity controls, and board-ready reporting.

Platform features through v1.7.2. Documentation library through v1.7.3.

---

## Product Overview

Interest-free loan management covering registration, approval, disbursement, weekly collections, reconciliation, expenses, communications, executive intelligence, and audit — designed for NGOs, government programmes, and institutional partners in Ghana and beyond.

---

## Problem Statement

Paper and spreadsheet programmes lack separation of duties, auditability, and timely portfolio visibility. Field-to-HQ cash reconciliation gaps create fraud risk. Leadership lacks real-time KPIs for decision-making.

---

## Solution

Modular TypeScript monolith on Next.js + Vercel + Neon with RBAC, operational pool ledgers, multi-channel notifications, executive intelligence, and contextual export capabilities.

---

## Target Users

Collectors, registration officers, approvers, auditors, super admins, programme directors, NGO boards, procurement committees, and institutional investors.

---

## Key Features

- Borrower lifecycle with document capture and GPS
- Loan approval with maker-checker controls
- Capital pool management with hard-stops
- Field collections with offline support
- Daily reconciliation and overpayment review
- Expense tracking with separation of duties
- Executive intelligence and forecasting
- Multi-channel notifications
- Contextual exports (PDF, Excel, CSV, Print)
- Operations incidents and maintenance windows

---

## Architecture

Next.js 14 App Router hosts `@wilms/domain` via Route Handlers. Custom HMAC session authentication. Neon PostgreSQL with Drizzle ORM. Optional Redis rate limits.

---

## Financial Model

Integer pesewas money. Pool replenishment, disbursement, repayment, adjustment ledger. Expenses affect operating cash only. Not a statutory GL.

---

## Security Model

HMAC sessions, RBAC with five roles, CSRF protection, audit logging, upload allowlists, rate limiting, confidentiality notices on exports.

---

## Deployment

Vercel production + Neon. Node.js 22.x. Migrations via domain SQL journal. Demo users for evaluation.

---

## Certification Status

Production operational platform. Financial integrity controls verified. Statutory GL and multi-org deferred.

---

## Roadmap Summary

v1.8 Integrations & Payments → v1.9 Enterprise Automation → v2.0 GL & Multi-branch → v3.0 Platform Scale

---

*CONFIDENTIAL — For authorized WILMS personnel, executive review, procurement, and official record keeping only.*
