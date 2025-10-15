const { describe, it, expect } = require('vitest');
import { render } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(<App />);
    expect(getByText('Your App Title')).toBeInTheDocument();
  });
});