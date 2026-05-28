# Persistent Storage Optimization

## Goal
Analyze storage patterns in the contract and document opportunities to reduce persistent storage usage, improve storage efficiency, and lower contract storage costs.

## Analysis

### Current storage model
- Contract-wide campaign state lives in instance storage using short symbol keys.
- Per-contributor persistent state is stored using `DataKey` variants keyed by contributor address.
- Many contributor-specific entries exist separately:
  - `Contribution(Address)`
  - `ContributorPresence(Address)`
  - `ContributionMessage(Address)`
  - `RecurringPlan(Address)`
  - `RecurringHistory(Address)`
  - `InsuranceFee(Address)`
  - `Whitelist(Address)` / `Blacklist(Address)`
  - `Delegation(Address)` / `DelegatedContribution(Address)`
  - `ContributorTier(Address)`
  - `ContributionHistory(Address)`

### Storage hotspots
- Repeated per-address keys can increase storage metadata overhead.
- Large `Vec` objects stored in instance storage can become expensive.
- Optional values stored as explicit entries may be better represented with absent keys.

## Compression and optimization strategies

### 1. Prefer compact keys and keyword reuse
- Use short symbol names for fixed instance storage keys (already in place).
- Consolidate contributor state where possible to reduce the number of distinct entries.

### 2. Avoid storing empty collections or default values
- Do not store `Vec` or complex structs unless they are non-empty.
- Remove keys once a contributor has left or their state is no longer required.

### 3. Group related per-contributor data
- Consider a single `ContributorProfile` struct for data that is always accessed together.
- Example:
  - `Contribution` amount
  - `ContributorPresence` flag
  - `ContributionMessage`

This can reduce the number of storage keys and simplify read/write patterns.

### 4. Use TTL and cleanup aggressively
- Keep contributor-specific entries under TTL where possible.
- Remove or reset entries when data is no longer needed (e.g., after refund).

### 5. Store derived data instead of redundant values
- Avoid storing both `Contribution` and `ContributorPresence` when one can infer the other.
- Keep the minimal necessary state to reconstruct derived metrics.

## Recommended next steps
1. Audit contributor-specific key usage in `contracts/crowdfund/src/lib.rs`.
2. Identify entries that can be merged into a compact struct.
3. Add tests to verify storage entries are created and removed correctly.
4. Measure storage entry count and compare before/after.

## Measurement
- Track number of persistent storage keys before and after changes.
- Measure contract storage size using Soroban environment tools or test harness output.
- Validate that contract behavior remains unchanged.
