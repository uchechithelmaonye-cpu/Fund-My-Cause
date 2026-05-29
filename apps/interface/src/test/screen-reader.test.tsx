import { render, screen } from '@testing-library/react';

describe('Screen Reader Support', () => {
  it('should announce page title', () => {
    render(
      <div>
        <h1>Fund My Cause - Crowdfunding Platform</h1>
      </div>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Fund My Cause - Crowdfunding Platform'
    );
  });

  it('should announce loading states', () => {
    render(
      <div role="status" aria-live="polite">
        Loading campaigns...
      </div>
    );

    expect(screen.getByRole('status')).toHaveTextContent('Loading campaigns...');
  });

  it('should announce form errors', () => {
    render(
      <div>
        <input aria-describedby="error" />
        <span id="error" role="alert">
          This field is required
        </span>
      </div>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should announce dynamic content updates', () => {
    render(
      <div role="region" aria-live="assertive" aria-label="Campaign updates">
        <p>Campaign goal reached!</p>
      </div>
    );

    expect(screen.getByRole('region')).toHaveTextContent('Campaign goal reached!');
  });

  it('should have proper landmark regions', () => {
    render(
      <div>
        <header role="banner">Header</header>
        <nav role="navigation">Navigation</nav>
        <main role="main">Main Content</main>
        <footer role="contentinfo">Footer</footer>
      </div>
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should announce list structure', () => {
    render(
      <ul>
        <li>Campaign 1</li>
        <li>Campaign 2</li>
        <li>Campaign 3</li>
      </ul>
    );

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('should announce table structure', () => {
    render(
      <table>
        <thead>
          <tr>
            <th>Campaign</th>
            <th>Raised</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Water Initiative</td>
            <td>$5,000</td>
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Campaign' })).toBeInTheDocument();
  });

  it('should announce skip links', () => {
    render(
      <div>
        <a href="#main-content" className="sr-only">
          Skip to main content
        </a>
        <nav>Navigation</nav>
        <main id="main-content">Main Content</main>
      </div>
    );

    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });
});
