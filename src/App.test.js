import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// ---------------------------------------------------------------------------
// Mock the Supabase client: every query is a chainable builder that resolves
// to "no rows" without touching the network. Plain functions on purpose —
// CRA's jest config sets resetMocks: true, which wipes jest.fn() setups.
// ---------------------------------------------------------------------------
jest.mock('./supabase', () => {
  const makeBuilder = () => {
    const builder = {};
    const chainable = [
      'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'gt',
      'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains',
      'containedBy', 'or', 'not', 'filter', 'order', 'limit', 'range',
      'textSearch', 'returns', 'csv', 'abortSignal',
    ];
    chainable.forEach((m) => { builder[m] = () => builder; });
    // .single() / .maybeSingle() semantically return one row (or none)
    builder.single = () => Promise.resolve({ data: null, error: null });
    builder.maybeSingle = () => Promise.resolve({ data: null, error: null });
    const listResult = Promise.resolve({ data: [], error: null, count: 0, status: 200 });
    builder.then = (res, rej) => listResult.then(res, rej);
    builder.catch = (rej) => listResult.catch(rej);
    return builder;
  };

  return {
    supabase: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => makeBuilder(),
      rpc: () => Promise.resolve({ data: null, error: null }),
      channel: () => {
        const ch = { on: () => ch, subscribe: () => ({ unsubscribe: () => {} }) };
        return ch;
      },
      removeChannel: () => {},
      removeChannels: () => {},
    },
  };
});

const renderAt = (path) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

test('app boots on the home route and the header shows the Survivor button', async () => {
  const { container } = renderAt('/');
  const survivorBtn = await screen.findByTitle('Survivor', {}, { timeout: 5000 });
  expect(survivorBtn).toBeInTheDocument();
  expect(container.textContent).toMatch(/jackpot/i);
});

test('survivor player page renders on /survivor', async () => {
  const { container } = renderAt('/survivor');
  // Give async effects a moment to settle, then check the hero rendered
  await new Promise((r) => setTimeout(r, 100));
  expect(container.textContent).toMatch(/survivor/i);
  expect(container.textContent).not.toMatch(/learn react/i);
});

test('survivor admin page renders on /survivoradmin', async () => {
  const { container } = renderAt('/survivoradmin');
  await new Promise((r) => setTimeout(r, 100));
  expect(container.textContent).toMatch(/survivor/i);
});
