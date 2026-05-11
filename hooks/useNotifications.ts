import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services';
import { AppNotification } from '../services/types';

const NOTIFICATION_KEYS = {
  unread: (userId: string) => ['notifications', 'unread', userId] as const,
  unreadCount: (userId: string) => ['notifications', 'unread-count', userId] as const,
  unreadCountByType: (userId: string, type: string) => ['notifications', 'unread-count', userId, type] as const,
  all: (userId: string) => ['notifications', 'all', userId] as const,
};

export const useUnreadNotifications = (userId: string | undefined | null) => {
  return useQuery<AppNotification[], Error>({
    queryKey: NOTIFICATION_KEYS.unread(userId!),
    queryFn: () => notificationService.getUnreadNotifications(userId!),
    enabled: !!userId,
  });
};

export const useUnreadNotificationCount = (userId: string | undefined | null) => {
  return useQuery<number, Error>({
    queryKey: NOTIFICATION_KEYS.unreadCount(userId!),
    queryFn: () => notificationService.getUnreadCount(userId!),
    enabled: !!userId,
    refetchInterval: 30000, // Poll every 30 seconds for new notifications
  });
};

export const useUnreadCountByType = (userId: string | undefined | null, type: string) => {
  return useQuery<number, Error>({
    queryKey: NOTIFICATION_KEYS.unreadCountByType(userId!, type),
    queryFn: () => notificationService.getUnreadCountByType(userId!, type),
    enabled: !!userId,
    refetchInterval: 30000,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ notificationId }: { notificationId: string; userId: string }) =>
      notificationService.markAsRead(notificationId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', variables.userId] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      notificationService.markAllAsRead(userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', variables.userId] });
    },
  });
};

export const useMarkNotificationsAsReadByType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, type }: { userId: string; type: string }) =>
      notificationService.markAsReadByType(userId, type),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', variables.userId] });
    },
  });
};
