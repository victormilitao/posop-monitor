import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useUnreadNotifications,
  useUnreadNotificationCount,
  useUnreadCountByType,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useMarkNotificationsAsReadByType,
} from '../useNotifications';

// Mock the service
jest.mock('../../services', () => ({
  notificationService: {
    getUnreadNotifications: jest.fn(),
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
    getUnreadCountByType: jest.fn(),
    markAsReadByType: jest.fn(),
  },
}));

const { notificationService } = require('../../services');

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useNotifications hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useUnreadNotifications', () => {
    it('deve retornar notificações não lidas quando userId é fornecido', async () => {
      const mockNotifications = [
        {
          id: 'n1',
          user_id: 'u1',
          type: 'new_orientation',
          title: 'Nova orientação',
          body: 'Dr. João: Repouse',
          data: { surgeryId: 's1' },
          is_read: false,
          created_at: '2026-05-06T10:00:00Z',
        },
      ];
      notificationService.getUnreadNotifications.mockResolvedValue(mockNotifications);

      const { result } = renderHook(() => useUnreadNotifications('u1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockNotifications);
      expect(notificationService.getUnreadNotifications).toHaveBeenCalledWith('u1');
    });

    it('não deve executar query quando userId é undefined', () => {
      const { result } = renderHook(() => useUnreadNotifications(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(notificationService.getUnreadNotifications).not.toHaveBeenCalled();
    });

    it('não deve executar query quando userId é null', () => {
      const { result } = renderHook(() => useUnreadNotifications(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(notificationService.getUnreadNotifications).not.toHaveBeenCalled();
    });
  });

  describe('useUnreadNotificationCount', () => {
    it('deve retornar contagem de não lidas', async () => {
      notificationService.getUnreadCount.mockResolvedValue(5);

      const { result } = renderHook(() => useUnreadNotificationCount('u1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBe(5);
      expect(notificationService.getUnreadCount).toHaveBeenCalledWith('u1');
    });

    it('não deve executar query quando userId é undefined', () => {
      const { result } = renderHook(() => useUnreadNotificationCount(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(notificationService.getUnreadCount).not.toHaveBeenCalled();
    });
  });

  describe('useUnreadCountByType', () => {
    it('deve retornar contagem por tipo', async () => {
      notificationService.getUnreadCountByType.mockResolvedValue(3);

      const { result } = renderHook(() => useUnreadCountByType('u1', 'new_orientation'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBe(3);
      expect(notificationService.getUnreadCountByType).toHaveBeenCalledWith('u1', 'new_orientation');
    });
  });

  describe('useMarkNotificationAsRead', () => {
    it('deve chamar markAsRead com o ID correto', async () => {
      notificationService.markAsRead.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMarkNotificationAsRead(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        notificationId: 'n1',
        userId: 'u1',
      });

      expect(notificationService.markAsRead).toHaveBeenCalledWith('n1');
    });
  });

  describe('useMarkAllNotificationsAsRead', () => {
    it('deve chamar markAllAsRead com userId correto', async () => {
      notificationService.markAllAsRead.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMarkAllNotificationsAsRead(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ userId: 'u1' });

      expect(notificationService.markAllAsRead).toHaveBeenCalledWith('u1');
    });
  });

  describe('useMarkNotificationsAsReadByType', () => {
    it('deve chamar markAsReadByType com userId e type corretos', async () => {
      notificationService.markAsReadByType.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMarkNotificationsAsReadByType(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        userId: 'u1',
        type: 'new_orientation',
      });

      expect(notificationService.markAsReadByType).toHaveBeenCalledWith('u1', 'new_orientation');
    });
  });
});
