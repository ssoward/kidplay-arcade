import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TwentyQuestions from './TwentyQuestions';
jest.mock('axios');
import axios from 'axios';

// Patch the mock to ensure .post is a jest.fn()
if (!axios.post) axios.post = jest.fn();

describe('TwentyQuestions', () => {
  beforeEach(() => {
    (axios.post as jest.Mock).mockReset();
  });

  it('renders intro and starts game', async () => {
    (axios.post as jest.Mock).mockResolvedValueOnce({ data: { message: 'Is it alive?' } });
    render(<TwentyQuestions onExit={() => {}} />);
    expect(screen.getByText(/Think of an object/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Start Game/i));
    await waitFor(() => expect(screen.getByText(/Questions Left/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Is it alive?')).toBeInTheDocument());
  });

  it('shows question and allows answering', async () => {
    (axios.post as jest.Mock).mockResolvedValueOnce({ data: { message: 'Is it alive?' } });
    (axios.post as jest.Mock).mockResolvedValueOnce({ data: { message: 'Is it bigger than a car?' } });
    render(<TwentyQuestions onExit={() => {}} />);
    fireEvent.click(screen.getByText(/Start Game/i));
    await waitFor(() => screen.getByText('Is it alive?'));
    fireEvent.click(screen.getByText(/Yes/));
    await waitFor(() => expect(screen.getByText(/Questions Left: 19/)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Is it bigger than a car/)).toBeInTheDocument());
  });
});
