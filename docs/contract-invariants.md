# Contract Invariants

## Purpose
Define and document the core invariants expected from the crowdsourcing contract and provide a reproducible plan for systematic invariant testing.

## Core invariants

### Contribution invariants
- Total raised should equal the sum of all recorded contribution amounts.
- No individual contributor record should be negative.
- Contributor count should match the number of unique contributors with non-zero contributions.

### Refund and withdraw invariants
- After a successful withdraw, contract token balance should be zero.
- After a refund, the contributor's recorded contribution should be zero.
- A contributor cannot receive a second refund for the same contribution.

### Emergency and delegation invariants
- Only authorized emergency approvers can change emergency state.
- Delegated contributions must update both delegator and delegatee state consistently.

### Campaign state invariants
- Deadlines cannot be moved backward.
- Goal adjustments must preserve campaign total and validity.
- Status transitions must follow the allowed lifecycle.

## Testing approach
1. Define invariant test cases in `contracts/crowdfund/tests/invariants.rs`.
2. Use randomized inputs where appropriate with `proptest`.
3. Cover every contract function with at least one invariant assertion.
4. Compare contract state before and after each state transition.

## Example invariants to test
- Contribution sum vs. total raised
- Zero contribution after refund
- Contract balance zero after withdraw
- No double refunds
- Whitelist and blacklist state consistency

## Documentation
- Keep an audit trail of invariant failures and fixes.
- Describe any contract-edge cases discovered during invariant testing.
- Add new invariants as the contract evolves.
