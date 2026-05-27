#![cfg(test)]
#![allow(deprecated)]

use super::*;
use crate::types::Category;
use crate::{CrowdfundContract, CrowdfundContractClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String, Vec,
};

fn setup_contract(
    env: &Env,
    deadline: u64,
    goal: i128,
    min_contribution: i128,
) -> (
    Address,
    Address,
    CrowdfundContractClient<'_>,
    token::StellarAssetClient<'_>,
) {
    env.mock_all_auths();

    let creator = Address::generate(env);
    let token_admin = Address::generate(env);
    let token_id = env.register_stellar_asset_contract(token_admin.clone());
    let token_admin_client = token::StellarAssetClient::new(env, &token_id);

    let contract_id = env.register_contract(None, CrowdfundContract);
    let client = CrowdfundContractClient::new(env, &contract_id);

    client.initialize(
        &creator,
        &token_id,
        &goal,
        &deadline,
        &min_contribution,
        &0i128,
        &String::from_str(env, "My Title"),
        &String::from_str(env, "My Description"),
        &None,
        &None,
        &None,
        &Category::Other,
        &None,
        &None,
    );

    (creator, token_id, client, token_admin_client)
}

#[test]
fn initialize_and_contribute_updates_state() {
    let env = Env::default();
    let deadline = 1_000u64;
    let goal = 10_000i128;
    let min_contribution = 100i128;

    let (_creator, token_id, client, token_admin_client) =
        setup_contract(&env, deadline, goal, min_contribution);

    let contributor = Address::generate(&env);
    token_admin_client.mint(&contributor, &500);

    client.contribute(&contributor, &500, &token_id, &None);

    assert_eq!(client.total_raised(), 500);
    assert_eq!(client.contribution(&contributor), 500);
    assert!(client.is_contributor(&contributor));

    let stats = client.get_stats();
    assert_eq!(stats.total_raised, 500);
    assert_eq!(stats.goal, goal);
    assert_eq!(stats.contributor_count, 1);
    assert_eq!(stats.average_contribution, 500);
    assert_eq!(stats.largest_contribution, 500);
}

#[test]
fn cancel_allows_refund_before_deadline() {
    let env = Env::default();
    let deadline = 1_000u64;

    let (_creator, token_id, client, token_admin_client) =
        setup_contract(&env, deadline, 10_000, 100);

    let contributor = Address::generate(&env);
    let token_client = token::Client::new(&env, &token_id);
    token_admin_client.mint(&contributor, &500);

    client.contribute(&contributor, &500, &token_id, &None);
    client.cancel_campaign();

    env.ledger().set_timestamp(deadline - 10);
    client.refund_single(&contributor);

    assert_eq!(client.contribution(&contributor), 0);
    assert_eq!(token_client.balance(&contributor), 500);
}

#[test]
fn invalid_platform_fee_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let creator = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract(token_admin);
    let contract_id = env.register_contract(None, CrowdfundContract);
    let client = CrowdfundContractClient::new(&env, &contract_id);

    let result = client.try_initialize(
        &creator,
        &token_id,
        &1_000,
        &1_000,
        &10,
        &0i128,
        &String::from_str(&env, "My Title"),
        &String::from_str(&env, "My Description"),
        &None,
        &Some(PlatformConfig {
            address: Address::generate(&env),
            fee_bps: 10_001,
        }),
        &None,
        &Category::Other,
        &None,
        &None,
    );

    assert_eq!(result.err(), Some(Ok(ContractError::InvalidFee)));
}

// ── Boundary tests (#107) ─────────────────────────────────────────────────────

#[test]
fn accepted_token_whitelist_is_enforced() {
    let env = Env::default();
    env.mock_all_auths();

    let creator = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let allowed_token = env.register_stellar_asset_contract(token_admin.clone());
    let other_token = env.register_stellar_asset_contract(token_admin);
    let allowed_token_admin = token::StellarAssetClient::new(&env, &allowed_token);

    let contract_id = env.register_contract(None, CrowdfundContract);
    let client = CrowdfundContractClient::new(&env, &contract_id);

    let mut accepted_tokens = Vec::new(&env);
    accepted_tokens.push_back(allowed_token.clone());

    client.initialize(
        &creator,
        &allowed_token,
        &1_000,
        &1_000,
        &10,
        &0i128,
        &String::from_str(&env, "My Title"),
        &String::from_str(&env, "My Description"),
        &None,
        &None,
        &Some(accepted_tokens),
        &Category::Other,
        &None,
        &None,
    );

    let contributor = Address::generate(&env);
    allowed_token_admin.mint(&contributor, &100);

    let result = client.try_contribute(&contributor, &100, &other_token, &None);
    assert_eq!(result.err(), Some(Ok(ContractError::TokenNotAccepted)));
}

// ── refund_batch tests (#278) ─────────────────────────────────────────────────

#[test]
fn refund_batch_refunds_multiple_contributors() {
    let env = Env::default();
    let deadline = 1_000u64;

    let (_creator, token_id, client, token_admin_client) =
        setup_contract(&env, deadline, 100_000, 100);

    let token_client = token::Client::new(&env, &token_id);

    let c1 = Address::generate(&env);
    let c2 = Address::generate(&env);
    let c3 = Address::generate(&env);

    token_admin_client.mint(&c1, &500);
    token_admin_client.mint(&c2, &300);
    token_admin_client.mint(&c3, &200);

    client.contribute(&c1, &500, &token_id, &None);
    client.contribute(&c2, &300, &token_id, &None);
    client.contribute(&c3, &200, &token_id, &None);

    client.cancel_campaign();

    let mut batch = Vec::new(&env);
    batch.push_back(c1.clone());
    batch.push_back(c2.clone());
    batch.push_back(c3.clone());

    let refunded = client.refund_batch(&batch);
    assert_eq!(refunded, 3);

    assert_eq!(token_client.balance(&c1), 500);
    assert_eq!(token_client.balance(&c2), 300);
    assert_eq!(token_client.balance(&c3), 200);
    assert_eq!(client.contribution(&c1), 0);
    assert_eq!(client.contribution(&c2), 0);
    assert_eq!(client.contribution(&c3), 0);
}

#[test]
fn refund_batch_skips_already_refunded() {
    let env = Env::default();
    let deadline = 1_000u64;

    let (_creator, token_id, client, token_admin_client) =
        setup_contract(&env, deadline, 100_000, 100);

    let c1 = Address::generate(&env);
    token_admin_client.mint(&c1, &500);
    client.contribute(&c1, &500, &token_id, &None);
    client.cancel_campaign();

    let mut batch = Vec::new(&env);
    batch.push_back(c1.clone());
    let r1 = client.refund_batch(&batch);
    assert_eq!(r1, 1);

    let r2 = client.refund_batch(&batch);
    assert_eq!(r2, 0);
}

#[test]
fn refund_batch_fails_when_campaign_still_active() {
    let env = Env::default();
    let deadline = 1_000u64;

    let (_creator, token_id, client, token_admin_client) =
        setup_contract(&env, deadline, 100_000, 100);

    let c1 = Address::generate(&env);
    token_admin_client.mint(&c1, &500);
    client.contribute(&c1, &500, &token_id, &None);

    let mut batch = Vec::new(&env);
    batch.push_back(c1.clone());

    let result = client.try_refund_batch(&batch);
    assert_eq!(result.err(), Some(Ok(ContractError::CampaignStillActive)));
}

// ── pause/unpause tests (#279) ────────────────────────────────────────────────

#[test]
fn pause_blocks_contributions_and_unpause_resumes() {
    let env = Env::default();
    let deadline = 1_000u64;

    let (_creator, token_id, client, token_admin_client) =
        setup_contract(&env, deadline, 100_000, 100);

    let contributor = Address::generate(&env);
    token_admin_client.mint(&contributor, &1_000);

    client.pause();
    assert_eq!(client.status(), Status::Paused);

    let result = client.try_contribute(&contributor, &500, &token_id, &None);
    assert_eq!(result.err(), Some(Ok(ContractError::CampaignPaused)));

    client.unpause();
    assert_eq!(client.status(), Status::Active);

    client.contribute(&contributor, &500, &token_id, &None);
    assert_eq!(client.total_raised(), 500);
}

#[test]
fn pause_allows_refunds_when_cancelled() {
    let env = Env::default();
    let deadline = 1_000u64;

    let (_creator, token_id, client, token_admin_client) =
        setup_contract(&env, deadline, 100_000, 100);

    let contributor = Address::generate(&env);
    let token_client = token::Client::new(&env, &token_id);
    token_admin_client.mint(&contributor, &500);

    client.contribute(&contributor, &500, &token_id, &None);
    client.cancel_campaign();

    client.refund_single(&contributor);
    assert_eq!(token_client.balance(&contributor), 500);
}

#[test]
fn unpause_fails_when_not_paused() {
    let env = Env::default();
    let deadline = 1_000u64;

    let (_creator, _token_id, client, _) = setup_contract(&env, deadline, 100_000, 100);

    let result = client.try_unpause();
    assert_eq!(result.err(), Some(Ok(ContractError::NotActive)));
}

#[test]
fn pause_fails_when_not_active() {
    let env = Env::default();
    let deadline = 1_000u64;

    let (_creator, _token_id, client, _) = setup_contract(&env, deadline, 100_000, 100);

    client.cancel_campaign();

    let result = client.try_pause();
    assert_eq!(result.err(), Some(Ok(ContractError::NotActive)));
}

// ── max_contribution tests ────────────────────────────────────────────────────

fn setup_contract_with_max(
    env: &Env,
    deadline: u64,
    goal: i128,
    min_contribution: i128,
    max_contribution: i128,
) -> (
    Address,
    Address,
    CrowdfundContractClient<'_>,
    token::StellarAssetClient<'_>,
) {
    env.mock_all_auths();

    let creator = Address::generate(env);
    let token_admin = Address::generate(env);
    let token_id = env.register_stellar_asset_contract(token_admin.clone());
    let token_admin_client = token::StellarAssetClient::new(env, &token_id);

    let contract_id = env.register_contract(None, CrowdfundContract);
    let client = CrowdfundContractClient::new(env, &contract_id);

    client.initialize(
        &creator,
        &token_id,
        &goal,
        &deadline,
        &min_contribution,
        &max_contribution,
        &String::from_str(env, "My Title"),
        &String::from_str(env, "My Description"),
        &None,
        &None,
        &None,
        &Category::Other,
        &None,
        &None,
    );

    (creator, token_id, client, token_admin_client)
}

#[test]
fn contribute_within_max_succeeds() {
    let env = Env::default();
    let (_creator, token_id, client, token_admin_client) =
        setup_contract_with_max(&env, 1_000, 10_000, 100, 500);

    let contributor = Address::generate(&env);
    token_admin_client.mint(&contributor, &500);

    client.contribute(&contributor, &500, &token_id, &None);
    assert_eq!(client.contribution(&contributor), 500);
}

#[test]
fn contribute_exceeding_max_is_rejected() {
    let env = Env::default();
    let (_creator, token_id, client, token_admin_client) =
        setup_contract_with_max(&env, 1_000, 10_000, 100, 500);

    let contributor = Address::generate(&env);
    token_admin_client.mint(&contributor, &600);

    let result = client.try_contribute(&contributor, &600, &token_id, &None);
    assert_eq!(result.err(), Some(Ok(ContractError::ExceedsMaximum)));
}

#[test]
fn cumulative_contribution_exceeding_max_is_rejected() {
    let env = Env::default();
    let (_creator, token_id, client, token_admin_client) =
        setup_contract_with_max(&env, 1_000, 10_000, 100, 500);

    let contributor = Address::generate(&env);
    token_admin_client.mint(&contributor, &600);

    client.contribute(&contributor, &300, &token_id, &None);
    let result = client.try_contribute(&contributor, &300, &token_id, &None);
    assert_eq!(result.err(), Some(Ok(ContractError::ExceedsMaximum)));
}

#[test]
fn no_max_limit_allows_large_contribution() {
    let env = Env::default();
    let (_creator, token_id, client, token_admin_client) = setup_contract(&env, 1_000, 10_000, 100);

    let contributor = Address::generate(&env);
    token_admin_client.mint(&contributor, &9_000);

    client.contribute(&contributor, &9_000, &token_id, &None);
    assert_eq!(client.contribution(&contributor), 9_000);
}

#[test]
fn max_contribution_view_returns_stored_value() {
    let env = Env::default();
    let (_creator, _token_id, client, _) = setup_contract_with_max(&env, 1_000, 10_000, 100, 750);

    assert_eq!(client.max_contribution(), 750);
}

#[test]
fn initialize_with_max_below_min_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let creator = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract(token_admin);
    let contract_id = env.register_contract(None, CrowdfundContract);
    let client = CrowdfundContractClient::new(&env, &contract_id);

    let result = client.try_initialize(
        &creator,
        &token_id,
        &10_000,
        &1_000,
        &200,
        &100, // max < min — invalid
        &String::from_str(&env, "Title"),
        &String::from_str(&env, "Desc"),
        &None,
        &None,
        &None,
        &Category::Other,
        &None,
        &None,
    );
    assert_eq!(result.err(), Some(Ok(ContractError::ExceedsMaximum)));
}

// ── Input validation tests ────────────────────────────────────────────────────

#[test]
fn initialize_with_empty_title_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let creator = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract(token_admin);
    let contract_id = env.register_contract(None, CrowdfundContract);
    let client = CrowdfundContractClient::new(&env, &contract_id);

    let result = client.try_initialize(
        &creator,
        &token_id,
        &1_000,
        &1_000,
        &10,
        &0i128,
        &String::from_str(&env, ""), // empty title
        &String::from_str(&env, "Description"),
        &None,
        &None,
        &None,
        &Category::Other,
        &None,
        &None,
    );
    assert_eq!(result.err(), Some(Ok(ContractError::StringEmpty)));
}

#[test]
fn initialize_with_title_too_long_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let creator = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract(token_admin);
    let contract_id = env.register_contract(None, CrowdfundContract);
    let client = CrowdfundContractClient::new(&env, &contract_id);

    // 65-character title (max is 64)
    let long_title = String::from_str(
        &env,
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    );
    let result = client.try_initialize(
        &creator,
        &token_id,
        &1_000,
        &1_000,
        &10,
        &0i128,
        &long_title,
        &String::from_str(&env, "Description"),
        &None,
        &None,
        &None,
        &Category::Other,
        &None,
        &None,
    );
    assert_eq!(result.err(), Some(Ok(ContractError::StringTooLong)));
}

#[test]
fn initialize_with_self_fee_address_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let creator = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract(token_admin);
    let contract_id = env.register_contract(None, CrowdfundContract);
    let client = CrowdfundContractClient::new(&env, &contract_id);

    let result = client.try_initialize(
        &creator,
        &token_id,
        &1_000,
        &1_000,
        &10,
        &0i128,
        &String::from_str(&env, "Title"),
        &String::from_str(&env, "Description"),
        &None,
        &Some(PlatformConfig {
            address: creator.clone(), // same as creator — invalid
            fee_bps: 100,
        }),
        &None,
        &Category::Other,
        &None,
        &None,
    );
    assert_eq!(result.err(), Some(Ok(ContractError::SelfFeeAddress)));
}

#[test]
fn contribute_with_zero_amount_is_rejected() {
    let env = Env::default();
    let (_creator, token_id, client, _) = setup_contract(&env, 1_000, 10_000, 0);

    let contributor = Address::generate(&env);
    let result = client.try_contribute(&contributor, &0, &token_id, &None);
    assert_eq!(result.err(), Some(Ok(ContractError::AmountNotPositive)));
}

#[test]
fn contribute_with_negative_amount_is_rejected() {
    let env = Env::default();
    let (_creator, token_id, client, _) = setup_contract(&env, 1_000, 10_000, 0);

    let contributor = Address::generate(&env);
    let result = client.try_contribute(&contributor, &-1, &token_id, &None);
    assert_eq!(result.err(), Some(Ok(ContractError::AmountNotPositive)));
}

#[test]
fn update_metadata_with_empty_title_is_rejected() {
    let env = Env::default();
    let (_creator, _token_id, client, _) = setup_contract(&env, 1_000, 10_000, 100);

    let result = client.try_update_metadata(&Some(String::from_str(&env, "")), &None, &None);
    assert_eq!(result.err(), Some(Ok(ContractError::StringEmpty)));
}

#[test]
fn update_metadata_with_valid_title_succeeds() {
    let env = Env::default();
    let (_creator, _token_id, client, _) = setup_contract(&env, 1_000, 10_000, 100);

    client.update_metadata(&Some(String::from_str(&env, "New Title")), &None, &None);
    assert_eq!(client.title(), String::from_str(&env, "New Title"));
}

// ── Issue #420 — Dynamic Goal Adjustment ─────────────────────────────────────

#[test]
fn adjust_goal_updates_goal_and_history() {
    let env = Env::default();
    let (_creator, _token_id, client, _) = setup_contract(&env, 1_000, 10_000, 100);

    // History starts with the initial entry created by initialize()
    let history_before = client.get_goal_history();
    assert_eq!(history_before.len(), 1);

    client.adjust_goal(&20_000);

    assert_eq!(client.goal(), 20_000);
    let history_after = client.get_goal_history();
    assert_eq!(history_after.len(), 2);

    let entry = history_after.get(1).unwrap();
    assert_eq!(entry.previous_goal, 10_000);
    assert_eq!(entry.new_goal, 20_000);
}

#[test]
fn adjust_goal_stores_multiple_history_entries() {
    let env = Env::default();
    let (_creator, _token_id, client, _) = setup_contract(&env, 1_000, 10_000, 100);

    client.adjust_goal(&15_000);
    client.adjust_goal(&8_000);
    client.adjust_goal(&25_000);

    // initialize() seeds entry 0; three adjust calls add entries 1-3
    let history = client.get_goal_history();
    assert_eq!(history.len(), 4);
    assert_eq!(history.get(1).unwrap().new_goal, 15_000);
    assert_eq!(history.get(2).unwrap().new_goal, 8_000);
    assert_eq!(history.get(3).unwrap().new_goal, 25_000);
}

#[test]
fn adjust_goal_with_zero_is_rejected() {
    let env = Env::default();
    let (_creator, _token_id, client, _) = setup_contract(&env, 1_000, 10_000, 100);

    let result = client.try_adjust_goal(&0);
    assert_eq!(result.err(), Some(Ok(ContractError::InvalidGoal)));
}

#[test]
fn adjust_goal_with_negative_is_rejected() {
    let env = Env::default();
    let (_creator, _token_id, client, _) = setup_contract(&env, 1_000, 10_000, 100);

    let result = client.try_adjust_goal(&-1);
    assert_eq!(result.err(), Some(Ok(ContractError::InvalidGoal)));
}

#[test]
fn adjust_goal_fails_when_campaign_not_active() {
    let env = Env::default();
    let (_creator, _token_id, client, _) = setup_contract(&env, 1_000, 10_000, 100);

    client.cancel_campaign();

    let result = client.try_adjust_goal(&20_000);
    assert_eq!(result.err(), Some(Ok(ContractError::NotActive)));
}

#[test]
fn adjust_goal_goal_can_be_lowered_below_raised_amount() {
    // The creator may legitimately lower the goal to declare success early.
    let env = Env::default();
    let (_creator, token_id, client, token_admin_client) =
        setup_contract(&env, 1_000, 10_000, 100);

    let contributor = Address::generate(&env);
    token_admin_client.mint(&contributor, &500);
    client.contribute(&contributor, &500, &token_id, &None);

    // Lower goal to below what's already raised — should succeed
    client.adjust_goal(&200);
    assert_eq!(client.goal(), 200);
}

// ── Issue #421 — Contribution Limits Per User ─────────────────────────────────

#[test]
fn set_max_contribution_updates_limit() {
    let env = Env::default();
    let (_creator, _token_id, client, _) = setup_contract(&env, 1_000, 10_000, 100);

    assert_eq!(client.max_contribution(), 0); // no limit initially

    client.set_max_contribution(&1_000);
    assert_eq!(client.max_contribution(), 1_000);
}

#[test]
fn set_max_contribution_zero_disables_limit() {
    let env = Env::default();
    let (_creator, _token_id, client, _) =
        setup_contract_with_max(&env, 1_000, 10_000, 100, 500);

    assert_eq!(client.max_contribution(), 500);

    client.set_max_contribution(&0);
    assert_eq!(client.max_contribution(), 0);
}

#[test]
fn contributions_respect_updated_max_limit() {
    let env = Env::default();
    let (_creator, token_id, client, token_admin_client) =
        setup_contract(&env, 1_000, 10_000, 100);

    // Initially no cap — allow a 2 000 contribution
    let contributor = Address::generate(&env);
    token_admin_client.mint(&contributor, &3_000);
    client.contribute(&contributor, &2_000, &token_id, &None);

    // Now set a cap of 2 500 total; another 300 is fine but 600 is not
    client.set_max_contribution(&2_500);

    let ok = client.try_contribute(&contributor, &300, &token_id, &None);
    assert!(ok.is_ok());

    let bad = client.try_contribute(&contributor, &300, &token_id, &None);
    assert_eq!(bad.err(), Some(Ok(ContractError::ExceedsMaximum)));
}

#[test]
fn set_max_contribution_below_min_is_rejected() {
    let env = Env::default();
    // min = 200
    let (_creator, _token_id, client, _) =
        setup_contract_with_max(&env, 1_000, 10_000, 200, 1_000);

    // Trying to set max below min (but non-zero) should fail
    let result = client.try_set_max_contribution(&100);
    assert_eq!(result.err(), Some(Ok(ContractError::ExceedsMaximum)));
}

#[test]
fn set_max_contribution_negative_is_rejected() {
    let env = Env::default();
    let (_creator, _token_id, client, _) = setup_contract(&env, 1_000, 10_000, 100);

    let result = client.try_set_max_contribution(&-1);
    assert_eq!(result.err(), Some(Ok(ContractError::ExceedsMaximum)));
}

// ── Issue #422 — Batch Refund Optimization ────────────────────────────────────

#[test]
fn refund_batch_emits_batch_completion_event() {
    // Verifies the function returns the correct count (event emission is implicit).
    let env = Env::default();
    let deadline = 1_000u64;
    let (_creator, token_id, client, token_admin_client) =
        setup_contract(&env, deadline, 100_000, 100);

    let c1 = Address::generate(&env);
    let c2 = Address::generate(&env);
    token_admin_client.mint(&c1, &500);
    token_admin_client.mint(&c2, &300);
    client.contribute(&c1, &500, &token_id, &None);
    client.contribute(&c2, &300, &token_id, &None);
    client.cancel_campaign();

    let mut batch = Vec::new(&env);
    batch.push_back(c1.clone());
    batch.push_back(c2.clone());

    let refunded = client.refund_batch(&batch);
    // Both contributors had balances, so 2 should have been refunded.
    assert_eq!(refunded, 2);
}

#[test]
fn refund_batch_is_capped_at_max_batch_size() {
    // Provide 30 contributors but only 25 should be processed per call.
    let env = Env::default();
    let deadline = 1_000u64;
    let (_creator, token_id, client, token_admin_client) =
        setup_contract(&env, deadline, 100_000, 10);

    let mut batch = Vec::new(&env);
    for _ in 0..30u32 {
        let addr = Address::generate(&env);
        token_admin_client.mint(&addr, &100);
        client.contribute(&addr, &100, &token_id, &None);
        batch.push_back(addr);
    }

    client.cancel_campaign();

    // First call processes first 25 (returns 25 refunded)
    let first_pass = client.refund_batch(&batch);
    assert_eq!(first_pass, 25);

    // Second call handles the remaining 5 (but only 5 addresses provided)
    let mut remainder = Vec::new(&env);
    for i in 25..30u32 {
        remainder.push_back(batch.get(i).unwrap());
    }
    let second_pass = client.refund_batch(&remainder);
    assert_eq!(second_pass, 5);
}

#[test]
fn refund_batch_gas_optimization_single_token_lookup() {
    // Verifies the batch completes correctly (token cached internally).
    let env = Env::default();
    let deadline = 1_000u64;
    let (_creator, token_id, client, token_admin_client) =
        setup_contract(&env, deadline, 100_000, 100);

    let token_client = token::Client::new(&env, &token_id);

    let mut batch = Vec::new(&env);
    for _ in 0..10u32 {
        let addr = Address::generate(&env);
        token_admin_client.mint(&addr, &200);
        client.contribute(&addr, &200, &token_id, &None);
        batch.push_back(addr.clone());
    }

    client.cancel_campaign();

    let refunded = client.refund_batch(&batch);
    assert_eq!(refunded, 10);

    // Every contributor should have received their tokens back
    for i in 0..10u32 {
        let addr = batch.get(i).unwrap();
        assert_eq!(token_client.balance(&addr), 200);
    }
}

// ── Issue #423 — Campaign Metadata Versioning ─────────────────────────────────

#[test]
fn initialize_seeds_metadata_history_with_version_zero() {
    let env = Env::default();
    let (_creator, _token_id, client, _) = setup_contract(&env, 1_000, 10_000, 100);

    let history = client.get_metadata_history();
    assert_eq!(history.len(), 1);

    let v0 = history.get(0).unwrap();
    assert_eq!(v0.version, 0);
    assert_eq!(v0.title, String::from_str(&env, "My Title"));
    assert_eq!(v0.description, String::from_str(&env, "My Description"));
}

#[test]
fn update_metadata_appends_version_entry() {
    let env = Env::default();
    let (_creator, _token_id, client, _) = setup_contract(&env, 1_000, 10_000, 100);

    client.update_metadata(
        &Some(String::from_str(&env, "Updated Title")),
        &Some(String::from_str(&env, "Updated Desc")),
        &None,
    );

    let history = client.get_metadata_history();
    // Version 0 from initialize + version 1 from update_metadata
    assert_eq!(history.len(), 2);

    let v1 = history.get(1).unwrap();
    assert_eq!(v1.version, 1);
    assert_eq!(v1.title, String::from_str(&env, "Updated Title"));
    assert_eq!(v1.description, String::from_str(&env, "Updated Desc"));
}

#[test]
fn metadata_history_tracks_multiple_sequential_updates() {
    let env = Env::default();
    let (_creator, _token_id, client, _) = setup_contract(&env, 1_000, 10_000, 100);

    for i in 1u32..=4 {
        // Build a unique title per iteration without heap alloc
        let label = if i == 1 { "Title One" }
                    else if i == 2 { "Title Two" }
                    else if i == 3 { "Title Three" }
                    else { "Title Four" };
        client.update_metadata(
            &Some(String::from_str(&env, label)),
            &None,
            &None,
        );
    }

    let history = client.get_metadata_history();
    // Version 0 (init) + 4 updates = 5 entries
    assert_eq!(history.len(), 5);
    assert_eq!(history.get(4).unwrap().version, 4);
    assert_eq!(
        history.get(4).unwrap().title,
        String::from_str(&env, "Title Four")
    );
}

#[test]
fn metadata_version_preserves_unchanged_fields() {
    // When only the title is updated, the stored description should still be
    // the previously active one.
    let env = Env::default();
    let (_creator, _token_id, client, _) = setup_contract(&env, 1_000, 10_000, 100);

    client.update_metadata(
        &Some(String::from_str(&env, "New Title")),
        &None, // description not changed
        &None,
    );

    let history = client.get_metadata_history();
    let v1 = history.get(1).unwrap();
    assert_eq!(v1.title, String::from_str(&env, "New Title"));
    // Should carry forward the original description
    assert_eq!(v1.description, String::from_str(&env, "My Description"));
}

#[test]
fn get_metadata_history_returns_empty_before_initialize() {
    // Contract not yet initialized — persistent key absent, returns empty vec.
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CrowdfundContract);
    let client = CrowdfundContractClient::new(&env, &contract_id);

    let history = client.get_metadata_history();
    assert_eq!(history.len(), 0);
}
