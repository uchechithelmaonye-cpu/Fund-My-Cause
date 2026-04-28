import { AppError, ErrorCode, toAppError, getUserMessage } from "./errors";

// ── AppError ──────────────────────────────────────────────────────────────────

describe("AppError", () => {
  it("sets name, code, and default message", () => {
    const err = new AppError(ErrorCode.WALLET_NOT_CONNECTED);
    expect(err.name).toBe("AppError");
    expect(err.code).toBe(ErrorCode.WALLET_NOT_CONNECTED);
    expect(err.message).toBe("Please connect your wallet to continue.");
  });

  it("accepts a custom message override", () => {
    const err = new AppError(ErrorCode.UNKNOWN, "custom msg");
    expect(err.message).toBe("custom msg");
  });

  it("stores the original error", () => {
    const original = new Error("raw");
    const err = new AppError(ErrorCode.UNKNOWN, undefined, original);
    expect(err.originalError).toBe(original);
  });

  it("assigns severity from the map", () => {
    expect(new AppError(ErrorCode.WALLET_REJECTED).severity).toBe("info");
    expect(new AppError(ErrorCode.CONTRACT_OVERFLOW).severity).toBe("fatal");
    expect(new AppError(ErrorCode.NETWORK_TX_FAILED).severity).toBe("error");
    expect(new AppError(ErrorCode.NETWORK_TX_TIMEOUT).severity).toBe("warning");
  });

  it("defaults severity to 'error' for unmapped codes", () => {
    expect(new AppError(ErrorCode.UNKNOWN).severity).toBe("error");
  });
});

// ── toAppError ────────────────────────────────────────────────────────────────

describe("toAppError", () => {
  it("passes AppError through unchanged", () => {
    const original = new AppError(ErrorCode.WALLET_REJECTED);
    expect(toAppError(original)).toBe(original);
  });

  // Contract errors
  it.each([
    ["AlreadyInitialized", ErrorCode.CONTRACT_ALREADY_INITIALIZED],
    ["CampaignEnded", ErrorCode.CONTRACT_CAMPAIGN_ENDED],
    ["CampaignStillActive", ErrorCode.CONTRACT_CAMPAIGN_ACTIVE],
    ["CampaignPaused", ErrorCode.CONTRACT_CAMPAIGN_PAUSED],
    ["GoalNotReached", ErrorCode.CONTRACT_GOAL_NOT_REACHED],
    ["GoalReached", ErrorCode.CONTRACT_GOAL_REACHED],
    ["NotActive", ErrorCode.CONTRACT_NOT_ACTIVE],
    ["BelowMinimum", ErrorCode.CONTRACT_BELOW_MINIMUM],
    ["ExceedsMaximum", ErrorCode.CONTRACT_EXCEEDS_MAXIMUM],
    ["InvalidDeadline", ErrorCode.CONTRACT_INVALID_DEADLINE],
    ["InvalidGoal", ErrorCode.CONTRACT_INVALID_GOAL],
    ["InvalidFee", ErrorCode.CONTRACT_INVALID_FEE],
    ["TokenNotAccepted", ErrorCode.CONTRACT_TOKEN_NOT_ACCEPTED],
    ["Overflow", ErrorCode.CONTRACT_OVERFLOW],
    ["HostError: something", ErrorCode.CONTRACT_CALL_FAILED],
  ])("maps ContractError '%s' → %s", (msg, expectedCode) => {
    const raw = Object.assign(new Error(msg), { name: "ContractError" });
    expect(toAppError(raw).code).toBe(expectedCode);
  });

  // Network errors
  it.each([
    ["Request timed out", ErrorCode.NETWORK_TIMEOUT],
    [
      "Transaction not confirmed after polling: abc",
      ErrorCode.NETWORK_TX_TIMEOUT,
    ],
    ["Transaction failed on-chain: abc", ErrorCode.NETWORK_TX_FAILED],
    ["Submit failed: rpc error", ErrorCode.NETWORK_RPC_ERROR],
    ["fetch error", ErrorCode.NETWORK_REQUEST_FAILED],
  ])("maps network TypeError '%s' → %s", (msg, expectedCode) => {
    const raw = Object.assign(new Error(msg), { name: "TypeError" });
    expect(toAppError(raw).code).toBe(expectedCode);
  });

  // Wallet errors
  it.each([
    ["wallet not connected", ErrorCode.WALLET_NOT_CONNECTED],
    ["User rejected the request", ErrorCode.WALLET_REJECTED],
    ["insufficient balance", ErrorCode.WALLET_INSUFFICIENT_FUNDS],
    ["freighter sign failed", ErrorCode.WALLET_SIGN_FAILED],
  ])("maps wallet error '%s' → %s", (msg, expectedCode) => {
    expect(toAppError(new Error(msg)).code).toBe(expectedCode);
  });

  it("maps invalid address error", () => {
    expect(toAppError(new Error("Invalid contract address format")).code).toBe(
      ErrorCode.VALIDATION_INVALID_ADDRESS,
    );
  });

  it("maps invalid amount error", () => {
    expect(toAppError(new Error("Invalid amount provided")).code).toBe(
      ErrorCode.VALIDATION_INVALID_AMOUNT,
    );
  });

  it("wraps a plain string as UNKNOWN", () => {
    const result = toAppError("something went wrong");
    expect(result.code).toBe(ErrorCode.UNKNOWN);
    expect(result.originalError).toBe("something went wrong");
  });

  it.each([null, undefined, { status: 500 }])(
    "wraps non-Error value %p as UNKNOWN",
    (value) => {
      expect(toAppError(value).code).toBe(ErrorCode.UNKNOWN);
    },
  );
});

// ── getUserMessage ────────────────────────────────────────────────────────────

describe("getUserMessage", () => {
  it("returns the mapped user message for a known code", () => {
    const err = new AppError(ErrorCode.CONTRACT_BELOW_MINIMUM);
    expect(getUserMessage(err)).toBe(
      "Your contribution is below the minimum amount.",
    );
  });

  it("falls back to UNKNOWN message for an unmapped code", () => {
    const err = new AppError("NONEXISTENT" as ErrorCode);
    expect(getUserMessage(err)).toBe(
      "An unexpected error occurred. Please try again.",
    );
  });

  it("every ErrorCode has a non-empty user message", () => {
    for (const code of Object.values(ErrorCode)) {
      expect(getUserMessage(new AppError(code))).toBeTruthy();
    }
  });
});
