#![cfg(test)]

mod common;

use soroban_sdk::{Address, Env};
use crate::common::{setup, Campaign};

#[test]
fn test_invariant_total_raised_matches_sum_of_contributions() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 10_000i128;
    let c = setup(&env, goal, deadline, None);

    let contributors: Vec<Address> = (0..4).map(|_| Address::generate(&env)).collect();
    let amounts = [1_000i128, 2_000, 1_500, 500];

    env.ledger().set_timestamp(500);
    for (addr, &amt) in contributors.iter().zip(amounts.iter()) {
        c.token_admin.mint(addr, &amt);
        c.client.contribute(addr, &amt, &c.token_id, &None);
    }

    let expected_total: i128 = amounts.iter().sum();
    assert_eq!(c.client.total_raised(), expected_total);

    let reported_sum: i128 = contributors
        .iter()
        .map(|addr| c.client.contribution(addr))
        .sum();
    assert_eq!(reported_sum, expected_total);
}

#[test]
fn test_invariant_contribution_zero_after_refund() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 5_000i128;
    let c = setup(&env, goal, deadline, None);

    let contributor = Address::generate(&env);
    let amount = 2_500i128;

    env.ledger().set_timestamp(500);
    c.token_admin.mint(contributor.clone(), &amount);
    c.client.contribute(contributor.clone(), &amount, &c.token_id, &None);

    env.ledger().set_timestamp(deadline + 1);
    assert!(c.client.try_withdraw().is_err());

    c.client.refund_single(&contributor);
    assert_eq!(c.client.contribution(&contributor), 0);
    assert_eq!(c.token.balance(&c.contract_id), 0);
}

#[test]
fn test_invariant_no_double_refund() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 5_000i128;
    let c = setup(&env, goal, deadline, None);

    let contributor = Address::generate(&env);
    let amount = 1_200i128;

    env.ledger().set_timestamp(500);
    c.token_admin.mint(contributor.clone(), &amount);
    c.client.contribute(contributor.clone(), &amount, &c.token_id, &None);

    env.ledger().set_timestamp(deadline + 1);
    assert!(c.client.try_withdraw().is_err());

    let before_balance = c.token.balance(&contributor);
    c.client.refund_single(&contributor);
    let after_first = c.token.balance(&contributor);
    c.client.refund_single(&contributor);
    let after_second = c.token.balance(&contributor);

    assert_eq!(after_second, after_first);
    assert_eq!(after_first, before_balance + amount);
    assert_eq!(c.client.contribution(&contributor), 0);
}

#[test]
fn test_invariant_contract_balance_zero_after_successful_withdraw() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 3_000i128;
    let platform_addr = Address::generate(&env);
    let fee_bps = 200u32;

    let c = setup(
        &env,
        goal,
        deadline,
        Some(crowdfund::PlatformConfig {
            address: platform_addr.clone(),
            fee_bps,
        }),
    );

    let contributor = Address::generate(&env);
    c.token_admin.mint(contributor.clone(), &goal);
    env.ledger().set_timestamp(500);
    c.client.contribute(contributor.clone(), &goal, &c.token_id, &None);

    env.ledger().set_timestamp(deadline + 1);
    c.client.withdraw();

    assert_eq!(c.token.balance(&c.contract_id), 0);
}
