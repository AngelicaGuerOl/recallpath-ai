import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5B5BD6',
    },
    secondary: {
      main: '#7B72E6',
    },
    background: {
      default: '#F7F7FC',
    },
  },
  shape: {
    borderRadius: 16,
  },
})

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  initialEntries?: string[]
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/decks'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </QueryClientProvider>
      </ThemeProvider>
    )
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}
