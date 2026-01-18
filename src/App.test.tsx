import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { describe, it, expect } from 'vitest';

describe('Flight Tracker App', () => {
  it('renders the search form', () => {
    render(<App />);
    expect(screen.getByText(/FlightTrack/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Flight Code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
  });

  it('allows user to input flight code and date', () => {
    render(<App />);
    const codeInput = screen.getByLabelText(/Flight Code/i) as HTMLInputElement;
    const dateInput = screen.getByLabelText(/Date/i) as HTMLInputElement;

    fireEvent.change(codeInput, { target: { value: 'BA123' } });
    fireEvent.change(dateInput, { target: { value: '2023-12-25' } });

    expect(codeInput.value).toBe('BA123');
    expect(dateInput.value).toBe('2023-12-25');
  });

  it('displays flight results after search', async () => {
    render(<App />);
    
    const codeInput = screen.getByLabelText(/Flight Code/i);
    const searchBtn = screen.getByText(/Track Flight/i);

    fireEvent.change(codeInput, { target: { value: 'TEST01' } });
    fireEvent.click(searchBtn);

    // Wait for the mock service delay
    expect(screen.getByText(/Searching.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('result-card')).toBeInTheDocument();
      expect(screen.getByText(/Mock Airlines/i)).toBeInTheDocument();
      expect(screen.getByText(/JFK/i)).toBeInTheDocument();
    });
  });
});
