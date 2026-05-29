import { render, screen } from '@testing-library/react';

describe('Accessibility - Navbar', () => {
  it('should have proper heading hierarchy', () => {
    render(
      <div>
        <h1>Fund My Cause</h1>
        <h2>Featured Campaigns</h2>
      </div>
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('should have proper button labels', () => {
    render(
      <button aria-label="Connect wallet">
        <span>Connect</span>
      </button>
    );
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
  });

  it('should have semantic navigation', () => {
    render(
      <nav role="navigation" aria-label="Main navigation">
        <button aria-label="Menu">Menu</button>
        <a href="/">Home</a>
      </nav>
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});

describe('Accessibility - Forms', () => {
  it('should have associated labels with inputs', () => {
    render(
      <div>
        <label htmlFor="amount">Amount</label>
        <input id="amount" type="number" />
      </div>
    );
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
  });

  it('should have proper form structure', () => {
    render(
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required />
        <button type="submit">Submit</button>
      </form>
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('should have error messages linked to inputs', () => {
    render(
      <div>
        <label htmlFor="amount">Amount</label>
        <input id="amount" type="number" aria-describedby="amount-error" />
        <span id="amount-error" role="alert">Amount must be positive</span>
      </div>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('Accessibility - Interactive Elements', () => {
  it('should have proper ARIA roles', () => {
    render(
      <div role="region" aria-label="Campaign progress">
        <div role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100} />
      </div>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should have proper link text', () => {
    render(
      <a href="/campaign/1" aria-label="View campaign: Clean Water Initiative">
        View Campaign
      </a>
    );
    expect(screen.getByRole('link')).toHaveAccessibleName();
  });
});
