//! # Fund-My-Cause Registry Contract
//!
//! A lightweight Soroban contract that maintains a deduplicated, paginated list
//! of all deployed [`CrowdfundContract`] campaign addresses on the Stellar network.
//!
//! ## Overview
//!
//! The registry acts as an on-chain directory. When a new campaign contract is
//! deployed, its address is registered here so that frontends and indexers can
//! discover all campaigns without relying on off-chain databases.
//!
//! ## Usage
//!
//! ```ignore
//! // Register a newly deployed campaign
//! registry_client.register(&campaign_contract_address);
//!
//! // List the first 20 campaigns
//! let page = registry_client.list(&0, &20);
//!
//! // List the next 20
//! let page2 = registry_client.list(&20, &20);
//! ```
//!
//! ## Storage
//!
//! All campaign addresses are stored in a single instance-storage entry under
//! the `CMPLIST` key as a `Vec<Address>`. Deduplication is enforced on write.

#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol, Vec};

/// Instance storage key for the list of registered campaign contract addresses.
const KEY_CAMPAIGNS: Symbol = symbol_short!("CMPLIST");

/// The Fund-My-Cause registry contract.
///
/// Maintains a deduplicated, append-only list of all deployed campaign contract
/// addresses. Provides paginated read access for frontends and indexers.
#[contract]
pub struct RegistryContract;

#[contractimpl]
impl RegistryContract {
    /// Registers a campaign contract address in the registry.
    ///
    /// If the address is already registered, this is a no-op — no duplicate
    /// entries are created and no event is emitted.
    ///
    /// # Arguments
    ///
    /// * `env` - The Soroban environment.
    /// * `campaign_id` - The contract address of the deployed campaign to register.
    ///
    /// # Side Effects
    ///
    /// - Appends `campaign_id` to the stored campaign list (if not already present).
    /// - Publishes a `("registry", "registered")` event with `campaign_id` as the
    ///   data payload.
    ///
    /// # Example
    ///
    /// ```ignore
    /// // Called immediately after deploying a new CrowdfundContract
    /// registry_client.register(&new_campaign_address);
    /// ```
    pub fn register(env: Env, campaign_id: Address) {
        let mut campaigns: Vec<Address> = env
            .storage()
            .instance()
            .get(&KEY_CAMPAIGNS)
            .unwrap_or_else(|| Vec::new(&env));

        if !campaigns.contains(&campaign_id) {
            campaigns.push_back(campaign_id.clone());
            env.storage().instance().set(&KEY_CAMPAIGNS, &campaigns);
            env.events()
                .publish(("registry", "registered"), campaign_id);
        }
    }

    /// Returns a paginated slice of registered campaign contract addresses.
    ///
    /// Pagination is zero-indexed: pass `offset = 0, limit = 20` for the first
    /// page, `offset = 20, limit = 20` for the second, and so on.
    ///
    /// # Arguments
    ///
    /// * `env` - The Soroban environment.
    /// * `offset` - Zero-based index of the first item to return.
    /// * `limit` - Maximum number of items to return. Passing `0` returns an
    ///   empty list immediately.
    ///
    /// # Returns
    ///
    /// A `Vec<Address>` containing up to `limit` campaign addresses starting at
    /// `offset`. Returns an empty `Vec` if:
    /// - `limit` is `0`, or
    /// - `offset` is beyond the end of the list, or
    /// - No campaigns have been registered yet.
    ///
    /// # Example
    ///
    /// ```ignore
    /// // Fetch campaigns 0–19
    /// let first_page: Vec<Address> = registry_client.list(&0, &20);
    ///
    /// // Fetch campaigns 20–39
    /// let second_page: Vec<Address> = registry_client.list(&20, &20);
    /// ```
    pub fn list(env: Env, offset: u32, limit: u32) -> Vec<Address> {
        if limit == 0 {
            return Vec::new(&env);
        }

        let campaigns: Vec<Address> = env
            .storage()
            .instance()
            .get(&KEY_CAMPAIGNS)
            .unwrap_or_else(|| Vec::new(&env));

        let total = campaigns.len();
        if offset >= total {
            return Vec::new(&env);
        }

        let end = offset.saturating_add(limit).min(total);
        let mut out = Vec::new(&env);

        let mut i = offset;
        while i < end {
            if let Some(addr) = campaigns.get(i) {
                out.push_back(addr);
            }
            i += 1;
        }

        out
    }
}

#[cfg(test)]
#[allow(deprecated)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address};

    #[test]
    fn register_deduplicates_and_lists_with_pagination() {
        let env = Env::default();

        let registry_id = env.register_contract(None, RegistryContract);
        let client = RegistryContractClient::new(&env, &registry_id);

        let a = Address::generate(&env);
        let b = Address::generate(&env);
        let c = Address::generate(&env);

        client.register(&a);
        client.register(&b);
        client.register(&a); // duplicate — should be ignored
        client.register(&c);

        // Total unique registrations: 3
        let page1 = client.list(&0, &2);
        assert_eq!(page1.len(), 2);

        let page2 = client.list(&2, &2);
        assert_eq!(page2.len(), 1);

        // Empty page beyond end
        let page3 = client.list(&10, &5);
        assert_eq!(page3.len(), 0);

        // limit = 0 returns empty
        let empty = client.list(&0, &0);
        assert_eq!(empty.len(), 0);
    }
}
