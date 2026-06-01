# Frontend API Reference

Complete reference for the Fund-My-Cause frontend TypeScript/React API.

## Table of Contents

- [Wallet Integration](#wallet-integration)
- [Contract Client](#contract-client)
- [Hooks](#hooks)
- [Components](#components)
- [Types](#types)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Wallet Integration

### WalletContext

Provides wallet connection and transaction signing functionality.

```typescript
import { useWallet } from '@/context/WalletContext';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTx: (tx: Transaction) => Promise<FeeBumpTransaction | Transaction>;
}
```

#### Usage

```typescript
function MyComponent() {
  const { address, isConnected, connect, disconnect } = useWallet();

  return (
    <div>
      {isConnected ? (
        <>
          <p>Connected: {address}</p>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

#### Methods

##### `connect()`

Initiates wallet connection via Freighter.

```typescript
const { connect } = useWallet();

try {
  await connect();
  // User is now connected
} catch (error) {
  console.error('Connection failed:', error);
}
```

**Errors:**
- `"Freighter not installed"` — User needs to install Freighter
- `"User rejected connection"` — User cancelled connection
- `"Network mismatch"` — Wallet network doesn't match app network

##### `disconnect()`

Disconnects the wallet.

```typescript
const { disconnect } = useWallet();

disconnect();
// address becomes null, isConnected becomes false
```

##### `signTx(tx)`

Signs a transaction with the connected wallet.

```typescript
const { signTx } = useWallet();

const signedTx = await signTx(transaction);
// Returns signed transaction ready for submission
```

**Parameters:**
- `tx` (Transaction) — Unsigned transaction

**Returns:** Signed transaction

**Errors:**
- `"User rejected signing"` — User cancelled
- `"Invalid transaction"` — Transaction is malformed

---

## Contract Client

### ContractClient

Wrapper around Soroban contract for type-safe interactions.

```typescript
import { ContractClient } from '@/lib/contract-client';

const client = new ContractClient(contractId, rpcUrl, networkPassphrase);
```

#### Constructor

```typescript
constructor(
  contractId: string,
  rpcUrl: string,
  networkPassphrase: string,
  horizonUrl?: string
)
```

**Parameters:**
- `contractId` — Contract address (starts with C)
- `rpcUrl` — Soroban RPC endpoint
- `networkPassphrase` — Network identifier
- `horizonUrl` — Optional Horizon API endpoint

#### Methods

##### `initialize(params)`

Initialize a new campaign.

```typescript
interface InitializeParams {
  creator: string;
  token: string;
  goal: bigint;
  deadline: number;
  minContribution: bigint;
  maxContribution: bigint;
  title: string;
  description: string;
  socialLinks?: string[];
  platformConfig?: PlatformConfig;
  acceptedTokens?: string[];
  category?: Category;
  vesting?: VestingSchedule;
}

const result = await client.initialize({
  creator: userAddress,
  token: xlmTokenAddress,
  goal: BigInt('1000000000'), // 100 XLM
  deadline: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
  minContribution: BigInt('10000000'), // 1 XLM
  maxContribution: BigInt('0'), // No limit
  title: 'My Campaign',
  description: 'Help us build something great',
  category: 'Technology',
});
```

**Returns:** Transaction hash

**Errors:**
- `ContractError.AlreadyInitialized` — Contract already initialized
- `ContractError.InvalidGoal` — Goal must be > 0
- `ContractError.InvalidDeadline` — Deadline must be in future

##### `contribute(params)`

Submit a contribution to the campaign.

```typescript
interface ContributeParams {
  contributor: string;
  amount: bigint;
  token: string;
  message?: string;
}

const result = await client.contribute({
  contributor: userAddress,
  amount: BigInt('50000000'), // 5 XLM
  token: xlmTokenAddress,
  message: 'Great project!',
});
```

**Returns:** Transaction hash

**Errors:**
- `ContractError.NotActive` — Campaign not accepting contributions
- `ContractError.CampaignEnded` — Deadline has passed
- `ContractError.BelowMinimum` — Amount below minimum
- `ContractError.ExceedsMaximum` — Amount exceeds per-contributor cap
- `ContractError.NotWhitelisted` — Address not on whitelist
- `ContractError.Blacklisted` — Address is blacklisted
- `ContractError.RateLimitExceeded` — Contribution rate limit hit

##### `withdraw()`

Creator claims funds after successful campaign.

```typescript
const result = await client.withdraw();
```

**Returns:** Transaction hash

**Errors:**
- `ContractError.NotActive` — Campaign not in correct state
- `ContractError.CampaignStillActive` — Deadline not reached
- `ContractError.GoalNotReached` — Funding goal not met
- `ContractError.VestingNotComplete` — Vesting cliff not reached

##### `refundSingle(contributor)`

Contributor claims refund after failed campaign.

```typescript
const result = await client.refundSingle(userAddress);
```

**Parameters:**
- `contributor` (string) — Address to refund

**Returns:** Transaction hash

**Errors:**
- `ContractError.GoalReached` — Campaign was successful
- `ContractError.CampaignStillActive` — Deadline not reached

##### `refundBatch(contributors)`

Batch refund multiple contributors.

```typescript
const result = await client.refundBatch([
  'GXXXXXX...',
  'GYYYYYY...',
  'GZZZZZZ...',
]);
```

**Parameters:**
- `contributors` (string[]) — Addresses to refund

**Returns:** Transaction hash

##### `updateMetadata(params)`

Update campaign metadata.

```typescript
interface UpdateMetadataParams {
  title?: string;
  description?: string;
  socialLinks?: string[];
}

const result = await client.updateMetadata({
  title: 'Updated Title',
  description: 'Updated description',
});
```

**Returns:** Transaction hash

##### `extendDeadline(newDeadline)`

Extend campaign deadline.

```typescript
const newDeadline = Math.floor(Date.now() / 1000) + 86400 * 60; // 60 days
const result = await client.extendDeadline(newDeadline);
```

**Parameters:**
- `newDeadline` (number) — New deadline as Unix timestamp

**Returns:** Transaction hash

##### `cancelCampaign()`

Cancel campaign; contributors can then claim refunds.

```typescript
const result = await client.cancelCampaign();
```

**Returns:** Transaction hash

##### `getStats()`

Get campaign statistics.

```typescript
const stats = await client.getStats();
// {
//   totalRaised: BigInt('500000000'),
//   goal: BigInt('1000000000'),
//   progressBps: 5000, // 50%
//   contributorCount: 42,
//   averageContribution: BigInt('11904761'),
//   largestContribution: BigInt('100000000'),
// }
```

**Returns:** `CampaignStats`

##### `getCampaignInfo()`

Get detailed campaign information.

```typescript
const info = await client.getCampaignInfo();
// {
//   creator: 'GXXXXXX...',
//   token: 'CXXXXXX...',
//   goal: BigInt('1000000000'),
//   deadline: 1800000000,
//   minContribution: BigInt('10000000'),
//   maxContribution: BigInt('0'),
//   title: 'My Campaign',
//   description: 'Help us build',
//   status: 'Active',
//   hasPlatformConfig: false,
//   platformFeeBps: 0,
//   platformAddress: 'GXXXXXX...',
//   category: 'Technology',
// }
```

**Returns:** `CampaignInfo`

##### `getContribution(contributor)`

Get a specific contributor's contribution amount.

```typescript
const amount = await client.getContribution(userAddress);
// BigInt('50000000')
```

**Parameters:**
- `contributor` (string) — Contributor address

**Returns:** Contribution amount in stroops

##### `getContributionHistory(contributor)`

Get all contributions from a specific address.

```typescript
const history = await client.getContributionHistory(userAddress);
// [
//   { amount: BigInt('10000000'), timestamp: 1700000000, runningTotal: BigInt('10000000') },
//   { amount: BigInt('40000000'), timestamp: 1700086400, runningTotal: BigInt('50000000') },
// ]
```

**Parameters:**
- `contributor` (string) — Contributor address

**Returns:** `ContributionRecord[]`

##### `getPerformanceMetrics()`

Get campaign performance metrics.

```typescript
const metrics = await client.getPerformanceMetrics();
// {
//   successRateBps: 5000, // 50%
//   contributionVelocity: BigInt('1000000'), // stroops per day
//   trending: 1, // positive = increasing
//   milestonesReached: 2,
//   totalMilestones: 5,
//   timeElapsed: 86400,
//   estimatedTimeToGoal: 172800,
//   averageDailyContribution: BigInt('500000'),
// }
```

**Returns:** `PerformanceMetrics`

##### `setupRecurring(params)`

Set up recurring contributions.

```typescript
interface RecurringParams {
  contributor: string;
  amount: bigint;
  interval: number; // seconds
  endDate: number; // Unix timestamp
}

const result = await client.setupRecurring({
  contributor: userAddress,
  amount: BigInt('10000000'), // 1 XLM per interval
  interval: 86400 * 7, // Weekly
  endDate: Math.floor(Date.now() / 1000) + 86400 * 365, // 1 year
});
```

**Returns:** Transaction hash

##### `executeRecurring(contributor)`

Execute a pending recurring contribution.

```typescript
const result = await client.executeRecurring(userAddress);
```

**Parameters:**
- `contributor` (string) — Contributor address

**Returns:** Transaction hash

##### `delegateContribution(params)`

Authorize a delegate to contribute on your behalf.

```typescript
interface DelegationParams {
  delegator: string;
  delegate: string;
  amount: bigint;
}

const result = await client.delegateContribution({
  delegator: userAddress,
  delegate: delegateAddress,
  amount: BigInt('100000000'), // Max 10 XLM
});
```

**Returns:** Transaction hash

##### `contributeOnBehalf(params)`

Submit a contribution on behalf of another address.

```typescript
interface ContributeOnBehalfParams {
  delegate: string;
  delegator: string;
  amount: bigint;
  token: string;
}

const result = await client.contributeOnBehalf({
  delegate: delegateAddress,
  delegator: userAddress,
  amount: BigInt('50000000'),
  token: xlmTokenAddress,
});
```

**Returns:** Transaction hash

##### `proposeExtension(params)`

Propose a deadline extension subject to contributor vote.

```typescript
interface ExtensionProposalParams {
  newDeadline: number;
  votingPeriod: number; // seconds
}

const result = await client.proposeExtension({
  newDeadline: Math.floor(Date.now() / 1000) + 86400 * 60,
  votingPeriod: 86400 * 7, // 7 days to vote
});
```

**Returns:** Transaction hash

##### `voteOnExtension(params)`

Vote on an active extension proposal.

```typescript
interface VoteParams {
  contributor: string;
  approve: boolean;
}

const result = await client.voteOnExtension({
  contributor: userAddress,
  approve: true,
});
```

**Returns:** Transaction hash

---

## Hooks

### useContractStats

Hook to fetch and cache campaign statistics.

```typescript
import { useContractStats } from '@/hooks/useContractStats';

function StatsDisplay() {
  const { stats, loading, error, refetch } = useContractStats(contractId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>Raised: {stats?.totalRaised.toString()} stroops</p>
      <p>Progress: {stats?.progressBps}%</p>
      <p>Contributors: {stats?.contributorCount}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

**Returns:**
```typescript
{
  stats: CampaignStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

### useContribution

Hook to fetch user's contribution amount.

```typescript
import { useContribution } from '@/hooks/useContribution';

function ContributionDisplay() {
  const { contribution, loading, error } = useContribution(
    contractId,
    userAddress
  );

  return <p>Your contribution: {contribution?.toString()} stroops</p>;
}
```

**Returns:**
```typescript
{
  contribution: bigint | null;
  loading: boolean;
  error: string | null;
}
```

### useContractInvoke

Hook for invoking contract functions with loading and error states.

```typescript
import { useContractInvoke } from '@/hooks/useContractInvoke';

function ContributeButton() {
  const { invoke, loading, error } = useContractInvoke();

  const handleContribute = async () => {
    try {
      const txHash = await invoke('contribute', {
        contributor: userAddress,
        amount: BigInt('50000000'),
        token: xlmTokenAddress,
      });
      console.log('Contribution submitted:', txHash);
    } catch (err) {
      console.error('Contribution failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleContribute} disabled={loading}>
        {loading ? 'Processing...' : 'Contribute'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

**Returns:**
```typescript
{
  invoke: (method: string, params: Record<string, unknown>) => Promise<string>;
  loading: boolean;
  error: string | null;
}
```

---

## Components

### PledgeModal

Modal component for submitting contributions.

```typescript
import { PledgeModal } from '@/components/PledgeModal';

interface PledgeModalProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txHash: string) => void;
  minAmount?: bigint;
  maxAmount?: bigint;
}

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Contribute</button>
      <PledgeModal
        campaignId={contractId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(txHash) => console.log('Success:', txHash)}
      />
    </>
  );
}
```

### ProgressBar

Visual progress indicator for campaign funding.

```typescript
import { ProgressBar } from '@/components/ProgressBar';

function CampaignHeader() {
  const { stats } = useContractStats(contractId);

  return (
    <ProgressBar
      raised={stats?.totalRaised || BigInt(0)}
      goal={stats?.goal || BigInt(0)}
      showPercentage
      animated
    />
  );
}
```

**Props:**
```typescript
interface ProgressBarProps {
  raised: bigint;
  goal: bigint;
  showPercentage?: boolean;
  animated?: boolean;
  height?: string;
  color?: string;
}
```

### CountdownTimer

Live countdown to campaign deadline.

```typescript
import { CountdownTimer } from '@/components/CountdownTimer';

function CampaignFooter() {
  const { info } = useContractInfo(contractId);

  return (
    <CountdownTimer
      deadline={info?.deadline || 0}
      onExpired={() => console.log('Campaign ended')}
    />
  );
}
```

**Props:**
```typescript
interface CountdownTimerProps {
  deadline: number; // Unix timestamp
  onExpired?: () => void;
  format?: 'short' | 'long'; // "2d 3h" vs "2 days 3 hours"
}
```

### ContributorList

Paginated list of campaign contributors.

```typescript
import { ContributorList } from '@/components/ContributorList';

function Contributors() {
  return (
    <ContributorList
      contractId={contractId}
      pageSize={20}
      showAmounts
    />
  );
}
```

**Props:**
```typescript
interface ContributorListProps {
  contractId: string;
  pageSize?: number;
  showAmounts?: boolean;
  onSelectContributor?: (address: string) => void;
}
```

### CampaignCard

Card component displaying campaign summary.

```typescript
import { CampaignCard } from '@/components/CampaignCard';

function CampaignGrid() {
  return (
    <div className="grid">
      {campaigns.map((id) => (
        <CampaignCard
          key={id}
          contractId={id}
          onClick={() => navigate(`/campaign/${id}`)}
        />
      ))}
    </div>
  );
}
```

**Props:**
```typescript
interface CampaignCardProps {
  contractId: string;
  onClick?: () => void;
  showStats?: boolean;
  compact?: boolean;
}
```

---

## Types

### CampaignStats

```typescript
interface CampaignStats {
  totalRaised: bigint;
  goal: bigint;
  progressBps: number; // 0-10000 (10000 = 100%)
  contributorCount: number;
  averageContribution: bigint;
  largestContribution: bigint;
}
```

### CampaignInfo

```typescript
interface CampaignInfo {
  creator: string;
  token: string;
  goal: bigint;
  deadline: number; // Unix timestamp
  minContribution: bigint;
  maxContribution: bigint;
  title: string;
  description: string;
  status: 'Active' | 'Successful' | 'Refunded' | 'Cancelled' | 'Paused';
  hasPlatformConfig: boolean;
  platformFeeBps: number;
  platformAddress: string;
  category: Category;
}
```

### ContributionRecord

```typescript
interface ContributionRecord {
  amount: bigint;
  timestamp: number;
  runningTotal: bigint;
}
```

### PerformanceMetrics

```typescript
interface PerformanceMetrics {
  successRateBps: number;
  contributionVelocity: bigint;
  trending: number;
  milestonesReached: number;
  totalMilestones: number;
  timeElapsed: number;
  estimatedTimeToGoal: number;
  averageDailyContribution: bigint;
}
```

### PlatformConfig

```typescript
interface PlatformConfig {
  address: string;
  feeBps: number; // 0-10000
}
```

### VestingSchedule

```typescript
interface VestingSchedule {
  cliff: number; // Unix timestamp
  duration: number; // Seconds
}
```

### Category

```typescript
type Category = 'Charity' | 'Technology' | 'Creative' | 'Event' | 'Personal' | 'Other';
```

---

## Error Handling

### ContractError

All contract errors are typed:

```typescript
enum ContractError {
  AlreadyInitialized = 1,
  CampaignEnded = 2,
  CampaignStillActive = 3,
  GoalNotReached = 4,
  GoalReached = 5,
  Overflow = 6,
  NotActive = 7,
  InvalidFee = 8,
  BelowMinimum = 9,
  InvalidDeadline = 10,
  CampaignPaused = 11,
  InvalidGoal = 12,
  TokenNotAccepted = 13,
  ExceedsMaximum = 14,
  NotWhitelisted = 15,
  Blacklisted = 16,
  // ... more errors
}
```

### Error Handling Pattern

```typescript
import { ContractError } from '@/lib/errors';

try {
  await client.contribute({
    contributor: userAddress,
    amount: BigInt('1000'),
    token: xlmTokenAddress,
  });
} catch (error) {
  if (error instanceof ContractError) {
    switch (error.code) {
      case ContractError.BelowMinimum:
        setError('Contribution below minimum amount');
        break;
      case ContractError.ExceedsMaximum:
        setError('Contribution exceeds maximum per contributor');
        break;
      case ContractError.NotWhitelisted:
        setError('Your address is not whitelisted for this campaign');
        break;
      case ContractError.Blacklisted:
        setError('Your address is blacklisted from this campaign');
        break;
      default:
        setError(`Contract error: ${error.message}`);
    }
  } else if (error instanceof Error) {
    setError(error.message);
  } else {
    setError('Unknown error occurred');
  }
}
```

---

## Examples

### Complete Contribution Flow

```typescript
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { ContractClient } from '@/lib/contract-client';
import { useContractStats } from '@/hooks/useContractStats';

function CampaignPage({ contractId }: { contractId: string }) {
  const { address, isConnected, connect } = useWallet();
  const { stats, loading: statsLoading } = useContractStats(contractId);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const client = new ContractClient(
    contractId,
    process.env.NEXT_PUBLIC_RPC_URL!,
    process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE!
  );

  const handleContribute = async () => {
    if (!isConnected || !address) {
      await connect();
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const amountStroops = BigInt(Math.floor(parseFloat(amount) * 10_000_000));
      
      const txHash = await client.contribute({
        contributor: address,
        amount: amountStroops,
        token: 'CAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4',
      });

      setSuccess(`Contribution submitted! TX: ${txHash}`);
      setAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Contribution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Campaign</h1>
      
      {statsLoading ? (
        <p>Loading...</p>
      ) : stats ? (
        <div>
          <p>Raised: {(Number(stats.totalRaised) / 10_000_000).toFixed(2)} XLM</p>
          <p>Goal: {(Number(stats.goal) / 10_000_000).toFixed(2)} XLM</p>
          <p>Progress: {(stats.progressBps / 100).toFixed(1)}%</p>
          <p>Contributors: {stats.contributorCount}</p>
        </div>
      ) : null}

      <div>
        <input
          type="number"
          placeholder="Amount (XLM)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
        />
        <button onClick={handleContribute} disabled={loading || !amount}>
          {loading ? 'Processing...' : 'Contribute'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
}

export default CampaignPage;
```

### Campaign Discovery

```typescript
import { useEffect, useState } from 'react';
import { ContractClient } from '@/lib/contract-client';

function CampaignDiscovery() {
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      const registryClient = new ContractClient(
        process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ID!,
        process.env.NEXT_PUBLIC_RPC_URL!,
        process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE!
      );

      try {
        // Fetch first 20 campaigns
        const result = await registryClient.list(0, 20);
        setCampaigns(result);
      } catch (err) {
        console.error('Failed to fetch campaigns:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  if (loading) return <p>Loading campaigns...</p>;

  return (
    <div>
      <h2>Active Campaigns</h2>
      <ul>
        {campaigns.map((id) => (
          <li key={id}>
            <a href={`/campaign/${id}`}>{id}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CampaignDiscovery;
```

---

## See Also

- [Smart Contract API Reference](./contract-api.md)
- [Wallet Integration Guide](./frontend-integration.md)
- [TypeScript Guide](./typescript-guide.md)
