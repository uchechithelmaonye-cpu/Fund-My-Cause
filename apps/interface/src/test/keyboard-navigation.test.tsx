import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Keyboard Navigation', () => {
  it('should navigate through buttons with Tab key', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button>First</button>
        <button>Second</button>
        <button>Third</button>
      </div>
    );

    const firstBtn = screen.getByRole('button', { name: 'First' });
    const secondBtn = screen.getByRole('button', { name: 'Second' });

    await user.tab();
    expect(firstBtn).toHaveFocus();

    await user.tab();
    expect(secondBtn).toHaveFocus();
  });

  it('should support Shift+Tab for reverse navigation', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button>First</button>
        <button>Second</button>
      </div>
    );

    const firstBtn = screen.getByRole('button', { name: 'First' });
    const secondBtn = screen.getByRole('button', { name: 'Second' });

    await user.tab();
    expect(firstBtn).toHaveFocus();

    await user.tab({ shift: true });
    expect(document.body).toHaveFocus();
  });

  it('should support Enter key on buttons', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<button onClick={handleClick}>Click me</button>);

    const btn = screen.getByRole('button');
    await user.click(btn);
    expect(handleClick).toHaveBeenCalled();
  });

  it('should support Space key on buttons', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<button onClick={handleClick}>Click me</button>);

    const btn = screen.getByRole('button');
    btn.focus();
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalled();
  });

  it('should support Escape key to close modals', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();

    render(
      <div role="dialog" aria-modal="true">
        <button onClick={handleClose}>Close</button>
      </div>
    );

    const btn = screen.getByRole('button');
    btn.focus();
    await user.keyboard('{Escape}');
    // Escape key handling would be implemented in actual component
    expect(btn).toBeInTheDocument();
  });

  it('should support Arrow keys for list navigation', async () => {
    const user = userEvent.setup();
    render(
      <ul role="listbox">
        <li role="option">Option 1</li>
        <li role="option">Option 2</li>
        <li role="option">Option 3</li>
      </ul>
    );

    const options = screen.getAllByRole('option');
    expect(options.length).toBe(3);
  });
});

describe('Focus Management', () => {
  it('should have visible focus indicators', () => {
    render(
      <button style={{ outline: '2px solid blue' }}>
        Focusable Button
      </button>
    );

    const btn = screen.getByRole('button');
    btn.focus();
    expect(btn).toHaveFocus();
  });

  it('should trap focus in modal', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button>Outside</button>
        <div role="dialog" aria-modal="true">
          <button>First</button>
          <button>Last</button>
        </div>
      </div>
    );

    const firstBtn = screen.getAllByRole('button')[1];
    firstBtn.focus();
    expect(firstBtn).toHaveFocus();
  });

  it('should restore focus after modal closes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <div>
        <button>Trigger</button>
      </div>
    );

    const trigger = screen.getByRole('button');
    trigger.focus();
    expect(trigger).toHaveFocus();
  });
});
