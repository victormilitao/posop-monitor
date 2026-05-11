-- Trigger function: creates an in-app notification when a doctor adds or updates an orientation
-- Push notification sending (via pg_net) will be added in a future migration
-- when push infrastructure (Apple Developer Program) is available

CREATE OR REPLACE FUNCTION notify_patient_on_orientation()
RETURNS TRIGGER AS $$
DECLARE
    v_patient_id UUID;
    v_doctor_name TEXT;
    v_title TEXT;
    v_body TEXT;
    v_notif_type TEXT;
BEGIN
    -- Determine notification type based on operation
    IF TG_OP = 'INSERT' THEN
        v_notif_type := 'new_orientation';
        v_title := 'Nova orientação do seu médico';
    ELSE
        v_notif_type := 'updated_orientation';
        v_title := 'Orientação atualizada pelo seu médico';
    END IF;

    -- Get patient_id from surgery
    SELECT s.patient_id INTO v_patient_id
    FROM public.surgeries s WHERE s.id = NEW.surgery_id;

    -- Get doctor name
    SELECT p.full_name INTO v_doctor_name
    FROM public.profiles p WHERE p.id = NEW.doctor_id;

    v_body := COALESCE(v_doctor_name, 'Seu médico') || ': ' || LEFT(NEW.content, 100);

    -- Create in-app notification
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
        v_patient_id,
        v_notif_type,
        v_title,
        v_body,
        jsonb_build_object(
            'surgeryId', NEW.surgery_id,
            'orientationId', NEW.id
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on INSERT and UPDATE of content only
CREATE TRIGGER trg_notify_orientation
    AFTER INSERT OR UPDATE OF content ON public.doctor_orientations
    FOR EACH ROW
    EXECUTE FUNCTION notify_patient_on_orientation();
