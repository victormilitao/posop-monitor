import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, waitFor, screen, fireEvent, act } from '@testing-library/react-native';

const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockSignOut = jest.fn();
const mockFrom = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: any[]) => mockGetSession(...args),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
    },
    from: (...args: any[]) => mockFrom(...args),
  },
}));

import { AuthProvider, useAuth } from '../AuthContext';

function TestConsumer() {
  const { user, profile, isLoading, isDoctor, isPatient, isAdmin, signOut } = useAuth();
  if (isLoading) return React.createElement(Text, { testID: 'loading' }, 'Loading');
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Text, { testID: 'user' }, user?.id || 'none'),
    React.createElement(Text, { testID: 'profile' }, profile?.full_name || 'none'),
    React.createElement(Text, { testID: 'isDoctor' }, String(isDoctor)),
    React.createElement(Text, { testID: 'isPatient' }, String(isPatient)),
    React.createElement(Text, { testID: 'isAdmin' }, String(isAdmin)),
    React.createElement(TouchableOpacity, { testID: 'signout-btn', onPress: signOut },
      React.createElement(Text, null, 'Sign Out'),
    ),
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  it('deve mostrar loading inicialmente e depois sem sessão', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(
      React.createElement(AuthProvider, null, React.createElement(TestConsumer)),
    );

    await waitFor(() => {
      expect(screen.getByTestId('user').props.children).toBe('none');
    });
  });

  it('deve carregar perfil de médico quando sessão existe', async () => {
    const mockSession = { user: { id: 'user-1' } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });

    const profileBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'user-1', full_name: 'Dr. Silva', role: 'doctor' },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(profileBuilder);

    render(
      React.createElement(AuthProvider, null, React.createElement(TestConsumer)),
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile').props.children).toBe('Dr. Silva');
      expect(screen.getByTestId('isDoctor').props.children).toBe('true');
    });
  });

  it('deve identificar paciente corretamente', async () => {
    const mockSession = { user: { id: 'user-2' } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });

    const profileBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'user-2', full_name: 'João', role: 'patient' },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(profileBuilder);

    render(
      React.createElement(AuthProvider, null, React.createElement(TestConsumer)),
    );

    await waitFor(() => {
      expect(screen.getByTestId('isPatient').props.children).toBe('true');
      expect(screen.getByTestId('isDoctor').props.children).toBe('false');
    });
  });

  it('deve tratar erro ao buscar perfil', async () => {
    const mockSession = { user: { id: 'user-1' } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });

    const profileBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      }),
    };
    mockFrom.mockReturnValue(profileBuilder);

    render(
      React.createElement(AuthProvider, null, React.createElement(TestConsumer)),
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile').props.children).toBe('none');
    });
  });

  it('deve chamar signOut', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignOut.mockResolvedValue({});

    render(
      React.createElement(AuthProvider, null, React.createElement(TestConsumer)),
    );

    await waitFor(() => {
      expect(screen.getByTestId('user').props.children).toBe('none');
    });

    fireEvent.press(screen.getByTestId('signout-btn'));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('deve reagir a onAuthStateChange com sessão', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    let authStateCallback: Function;
    mockOnAuthStateChange.mockImplementation((cb: Function) => {
      authStateCallback = cb;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    const profileBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'user-3', full_name: 'Admin', role: 'admin' },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(profileBuilder);

    render(
      React.createElement(AuthProvider, null, React.createElement(TestConsumer)),
    );

    await waitFor(() => {
      expect(screen.getByTestId('user').props.children).toBe('none');
    });

    // Simulate auth state change with new session
    await act(async () => {
      authStateCallback!('SIGNED_IN', { user: { id: 'user-3' } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('isAdmin').props.children).toBe('true');
    });
  });

  it('deve reagir a onAuthStateChange sem sessão (logout)', async () => {
    const mockSession = { user: { id: 'user-1' } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });

    let authStateCallback: Function;
    mockOnAuthStateChange.mockImplementation((cb: Function) => {
      authStateCallback = cb;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    const profileBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'user-1', full_name: 'Dr. Silva', role: 'doctor' },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(profileBuilder);

    render(
      React.createElement(AuthProvider, null, React.createElement(TestConsumer)),
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile').props.children).toBe('Dr. Silva');
    });

    // Simulate logout
    await act(async () => {
      authStateCallback!('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('profile').props.children).toBe('none');
    });
  });

  it('deve tratar exceção em fetchProfile', async () => {
    const mockSession = { user: { id: 'user-1' } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });

    const profileBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockRejectedValue(new Error('Network error')),
    };
    mockFrom.mockReturnValue(profileBuilder);

    render(
      React.createElement(AuthProvider, null, React.createElement(TestConsumer)),
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile').props.children).toBe('none');
    });
  });
});
