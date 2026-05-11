-- Create notifications table for in-app notification system
-- Generic structure to support any notification type (orientations, reminders, alerts, etc.)

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,          -- 'new_orientation' | 'updated_orientation' | future types...
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',    -- flexible payload: { surgeryId, orientationId, ... }
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own notifications
CREATE POLICY "Users read own notifications"
    ON public.notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users update own notifications"
    ON public.notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- Index for fast unread notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON public.notifications(user_id) WHERE is_read = false;

-- Index for ordering by creation date
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON public.notifications(user_id, created_at DESC);
