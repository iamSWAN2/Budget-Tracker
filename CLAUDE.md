# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Policy

Claude Code must ALWAYS respond in Korean (한국어) to all user interactions and communications throughout this project. Even when users submit prompts in English, Claude must respond in Korean.

## File Maintenance

When CLAUDE.md is modified, Claude Code must:
1. Read the entire contents of the updated CLAUDE.md file
2. Create a complete Korean translation of all content
3. Save the Korean version as CLAUDE_KO.md in the same directory
4. Ensure all technical terms and concepts are properly translated while maintaining accuracy

## Project Overview

This is an AI-powered household ledger application built with React 19, TypeScript, and Vite. The app integrates with Google Gemini AI for transaction analysis from bank statement images and uses a mock Supabase service for data persistence.

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server with Vite (hot reload enabled)
- `npm run build` - Build production bundle with Rollup optimizations
- `npm run preview` - Preview production build locally

## Environment Setup

The app requires a `GEMINI_API_KEY` in `.env.local` for AI features to work. The vite.config.ts exposes this as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` in the client.

Additional environment variables (optional):
- `SUPABASE_URL` - For real Supabase integration (currently uses mock service)  
- `SUPABASE_ANON_KEY` - For real Supabase integration (currently uses mock service)

## Architecture Overview

### Data Flow Pattern
The app follows a centralized data management pattern using a custom hook:

1. **useData Hook** (`hooks/useData.ts`) - Central data management layer that:
   - Manages accounts, transactions, and derived installments state
   - Provides CRUD operations for accounts and transactions  
   - Automatically recalculates account balances and installments when transactions change
   - Handles loading states and error management

2. **Service Layer** - Two service implementations:
   - `supabaseService.ts` - Mock database service with artificial delays
   - `geminiService.ts` - Google Gemini AI integration for transaction analysis

### State Management Strategy
- All data flows through the `useData` hook which provides a `UseDataReturn` interface
- Pages receive data and operations via this hook and pass them down to components
- Account balances are automatically recalculated when transactions are modified
- Installments are derived from transactions with `installmentMonths > 1`

### Page Structure
- **App.tsx** - Main router component with sidebar navigation
- **DashboardPage** - Charts and financial overview using Recharts
- **AccountsPage** - Account management with CRUD operations
- **InstallmentsPage** - Auto-calculated installment tracking
- **TransactionsPage** - Transaction management

### AI Integration Pattern
The AI assistant (`components/AIAssist.tsx`) follows a multi-step workflow:
1. File upload (bank statement image)
2. Gemini API analysis with structured schema
3. Transaction confirmation/editing interface  
4. Batch transaction import via `addMultipleTransactions`

## Key Implementation Details

### Balance Calculation
Account balances are automatically recalculated in `supabaseService.ts` whenever transactions are modified. The system:
- Starts from original mock account balance
- Subtracts original mock transactions to get initial balance
- Applies current transactions to derive final balance

### Installment Logic
Installments are derived in `useData.ts` from transactions with `installmentMonths > 1`:
- Calculates months elapsed since transaction date
- Determines remaining months and payments
- Filters out completed installments

### TypeScript Patterns
- Extensive use of enums (`TransactionType`, `AccountPropensity`)
- Generic CRUD patterns: `Omit<T, 'id'>` for creation, full `T` for updates
- Consistent return type patterns from hooks (`UseDataReturn`)

### Component Conventions
- Modal-based forms for data entry
- Consistent currency formatting with `Intl.NumberFormat`
- Recharts for data visualization with consistent color schemes from `constants.ts`

## File Organization

The codebase uses a feature-based structure:
- `/components` - Reusable UI components (layout, ui, icons)
- `/pages` - Route-level page components
- `/services` - External API integrations and data access
- `/hooks` - Custom React hooks for state management
- Root-level files: types, constants, and configuration

## Development Notes

- The app uses path aliases (`@/`) configured in both tsconfig.json and vite.config.ts
- Mock data arrays in `constants.ts` start empty - real data comes through the service layer
- Error handling is consistent across all async operations with try/catch patterns
- All service calls include artificial delays to simulate real API behavior

## Build Configuration

- **Bundle Optimization**: Manual chunks configured for `react`, `supabase`, and `charts` libraries
- **Code Splitting**: React.lazy() used for page-level components with Suspense fallbacks
- **Performance**: Chunk size warning limit raised to 1000kb for better optimization control
- **Path Resolution**: Root-level alias `@/` for clean imports throughout the codebase

## Claude Code Action Guidelines

When working with this codebase, Claude Code should follow these interaction protocols:

### Command Execution Protocol
Before executing any system commands, Claude Code must:
1. **Explain the Action**: Clearly describe what the command will do and its purpose
2. **Request Confirmation**: Ask the user for explicit permission before execution
3. **Example Format**: 
   ```
   I need to run `git push origin main` to upload your local commits to GitHub.
   This will make your code publicly available on the remote repository.
   Should I proceed with this action?
   ```

### Git Operations
- Always explain git commands before execution (add, commit, push, pull, etc.)
- Describe the impact on version control and remote repositories
- Confirm destructive operations (force push, reset, rebase) with extra caution

### File System Operations
- Explain file creation, modification, or deletion operations
- Describe the purpose and impact of structural changes
- Request permission for operations that affect project configuration

### Build and Deploy Operations
- Explain build processes and their outputs
- Describe deployment implications and targets
- Confirm operations that may affect production or public access

This protocol ensures transparent communication and prevents unintended system modifications.

## Critical Analysis and Response Protocol

Claude Code must not blindly comply with user requests. Instead, follow this enhanced interaction protocol:

### Analysis Before Action
Before responding to any request, Claude Code must:
1. **Critical Analysis**: Evaluate if there are better alternatives or potential issues
2. **Technical Assessment**: Consider performance, security, maintainability implications
3. **Best Practice Review**: Compare against industry standards and project conventions

### Response Protocol
Every response must include:
1. **Situation Understanding**: Confirm comprehension of the request and context
2. **Critical Evaluation**: Analyze pros/cons, suggest improvements if applicable  
3. **Action Explanation**: Clearly explain what the proposed action will accomplish
4. **Alternative Recommendations**: Propose better solutions when they exist

### Constructive Criticism
Claude Code should provide constructive feedback when:
- Requested approach has technical flaws or security risks
- Better architectural patterns or solutions exist
- Code quality or maintainability could be improved
- Industry best practices are not being followed

This ensures higher quality technical discussions and prevents suboptimal implementations.

## Important Instructions

**File Maintenance Policy:**
- ALWAYS prefer editing existing files over creating new ones
- NEVER create files unless absolutely necessary for the goal
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- Only create documentation files if explicitly requested by the user

**Task Completion Protocol:**
- Do what has been asked; nothing more, nothing less
- Focus on the specific task without adding unnecessary features or documentation