


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."create_patient_bypass"("patient_email" "text", "patient_password" "text", "patient_name" "text", "patient_cpf" "text" DEFAULT NULL::"text", "patient_sex" "text" DEFAULT NULL::"text", "patient_phone" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_user_id uuid;
  new_identity_id uuid;
BEGIN
  new_user_id := gen_random_uuid();
  new_identity_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    patient_email,
    crypt(patient_password, gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', patient_name, 'role', 'patient'),
    now(),
    now()
  );

  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_identity_id,
    new_user_id::character varying,
    new_user_id,
    jsonb_build_object('sub', new_user_id::character varying, 'email', patient_email, 'full_name', patient_name, 'role', 'patient', 'email_verified', true, 'phone_verified', false),
    'email',
    now(),
    now(),
    now()
  );

  -- Update the profile created by the trigger with cpf, sex, and phone
  UPDATE public.profiles
  SET
    cpf = patient_cpf,
    sex = patient_sex,
    phone = patient_phone
  WHERE id = new_user_id;

  RETURN new_user_id;
END;
$$;


ALTER FUNCTION "public"."create_patient_bypass"("patient_email" "text", "patient_password" "text", "patient_name" "text", "patient_cpf" "text", "patient_sex" "text", "patient_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'patient'), 
    new.email
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_patient_on_orientation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_patient_id UUID;
    v_doctor_name TEXT;
    v_title TEXT;
    v_body TEXT;
    v_notif_type TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_notif_type := 'new_orientation';
        v_title := 'Nova orientação do seu médico';
    ELSE
        v_notif_type := 'updated_orientation';
        v_title := 'Orientação atualizada pelo seu médico';
    END IF;

    SELECT s.patient_id INTO v_patient_id
    FROM public.surgeries s WHERE s.id = NEW.surgery_id;

    SELECT p.full_name INTO v_doctor_name
    FROM public.profiles p WHERE p.id = NEW.doctor_id;

    v_body := COALESCE(v_doctor_name, 'Seu médico') || ': ' || LEFT(NEW.content, 100);

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
$$;


ALTER FUNCTION "public"."notify_patient_on_orientation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_patient_profile"("p_patient_id" "uuid", "p_full_name" "text" DEFAULT NULL::"text", "p_cpf" "text" DEFAULT NULL::"text", "p_phone" "text" DEFAULT NULL::"text", "p_sex" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    cpf = COALESCE(p_cpf, cpf),
    phone = COALESCE(p_phone, phone),
    sex = COALESCE(p_sex, sex),
    updated_at = now()
  WHERE id = p_patient_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Patient profile not found: %', p_patient_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_patient_profile"("p_patient_id" "uuid", "p_full_name" "text", "p_cpf" "text", "p_phone" "text", "p_sex" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "severity" "text",
    "message" "text",
    "is_resolved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "surgery_id" "uuid",
    CONSTRAINT "alerts_severity_check" CHECK (("severity" = ANY (ARRAY['warning'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE,
    "pain_level" integer,
    "symptoms" "jsonb",
    "answers" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "surgery_id" "uuid",
    CONSTRAINT "daily_reports_pain_level_check" CHECK ((("pain_level" >= 0) AND ("pain_level" <= 10)))
);


ALTER TABLE "public"."daily_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "push_token" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."device_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."doctor_orientations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "surgery_id" "uuid" NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."doctor_orientations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "surgery_id" "uuid" NOT NULL,
    "photo_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "storage_path" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."patient_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "surgery_id" "uuid"
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "role" "text",
    "cpf" "text",
    "email" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sex" "text",
    "crm" "text",
    "phone_personal" "text",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'doctor'::"text", 'patient'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."question_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "value" "text" NOT NULL,
    "is_abnormal" boolean DEFAULT false,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."question_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "text" "text" NOT NULL,
    "input_type" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "questions_input_type_check" CHECK (("input_type" = ANY (ARRAY['text'::"text", 'scale'::"text", 'select'::"text", 'multiselect'::"text", 'boolean'::"text", 'numeric'::"text"])))
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."surgeries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "surgery_date" "date" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "surgery_type_id" "uuid" NOT NULL,
    "medical_status" "text" DEFAULT 'stable'::"text",
    "follow_up_days" integer,
    "hospital" "text",
    "contact_phone" "text",
    "contact_phone_business" "text",
    "has_drain" boolean DEFAULT false NOT NULL,
    CONSTRAINT "surgeries_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'cancelled'::"text", 'pending_return'::"text"])))
);


ALTER TABLE "public"."surgeries" OWNER TO "postgres";


COMMENT ON TABLE "public"."surgeries" IS 'Stores surgery records linking doctors and patients';



COMMENT ON COLUMN "public"."surgeries"."status" IS 'active: ongoing recovery, completed: finished, cancelled: surgery cancelled';



COMMENT ON COLUMN "public"."surgeries"."hospital" IS 'Hospital or clinic where the surgery/procedure was performed';



CREATE TABLE IF NOT EXISTS "public"."surgery_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "surgery_type_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."surgery_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."surgery_type_phase_guidelines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "surgery_type_id" "uuid" NOT NULL,
    "phase_start_day" integer NOT NULL,
    "phase_end_day" integer,
    "phase_title" "text" NOT NULL,
    "phase_subtitle" "text",
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "highlight_text" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."surgery_type_phase_guidelines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."surgery_type_signs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "surgery_type_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "surgery_type_signs_category_check" CHECK (("category" = ANY (ARRAY['alert'::"text", 'attention'::"text", 'normal'::"text"])))
);


ALTER TABLE "public"."surgery_type_signs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."surgery_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "expected_recovery_days" integer DEFAULT 14,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "applicable_sex" "text" DEFAULT 'both'::"text" NOT NULL,
    CONSTRAINT "surgery_types_applicable_sex_check" CHECK (("applicable_sex" = ANY (ARRAY['M'::"text", 'F'::"text", 'both'::"text"])))
);


ALTER TABLE "public"."surgery_types" OWNER TO "postgres";


COMMENT ON TABLE "public"."surgery_types" IS 'Catalog of available surgery types with specific configurations';



COMMENT ON COLUMN "public"."surgery_types"."expected_recovery_days" IS 'Default number of days for recovery period';



COMMENT ON COLUMN "public"."surgery_types"."is_active" IS 'Whether this surgery type is currently available for selection';



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_reports"
    ADD CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_user_id_push_token_key" UNIQUE ("user_id", "push_token");



ALTER TABLE ONLY "public"."doctor_orientations"
    ADD CONSTRAINT "doctor_orientations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_photos"
    ADD CONSTRAINT "patient_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_cpf_key" UNIQUE ("cpf");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_crm_key" UNIQUE ("crm");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."question_options"
    ADD CONSTRAINT "question_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."surgeries"
    ADD CONSTRAINT "surgeries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."surgery_questions"
    ADD CONSTRAINT "surgery_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."surgery_questions"
    ADD CONSTRAINT "surgery_questions_surgery_type_id_question_id_key" UNIQUE ("surgery_type_id", "question_id");



ALTER TABLE ONLY "public"."surgery_type_phase_guidelines"
    ADD CONSTRAINT "surgery_type_phase_guidelines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."surgery_type_signs"
    ADD CONSTRAINT "surgery_type_signs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."surgery_types"
    ADD CONSTRAINT "surgery_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."surgery_types"
    ADD CONSTRAINT "surgery_types_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_device_tokens_user_id" ON "public"."device_tokens" USING "btree" ("user_id") WHERE ("is_active" = true);



CREATE INDEX "idx_doctor_orientations_surgery_id" ON "public"."doctor_orientations" USING "btree" ("surgery_id");



CREATE INDEX "idx_notifications_user_created" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_notifications_user_unread" ON "public"."notifications" USING "btree" ("user_id") WHERE ("is_read" = false);



CREATE INDEX "idx_patient_photos_patient_date" ON "public"."patient_photos" USING "btree" ("patient_id", "photo_date");



CREATE INDEX "idx_patient_photos_surgery" ON "public"."patient_photos" USING "btree" ("surgery_id");



CREATE INDEX "idx_surgeries_doctor_id" ON "public"."surgeries" USING "btree" ("doctor_id");



CREATE INDEX "idx_surgeries_patient_id" ON "public"."surgeries" USING "btree" ("patient_id");



CREATE INDEX "idx_surgeries_status" ON "public"."surgeries" USING "btree" ("status");



CREATE INDEX "idx_surgery_type_phase_guidelines_type_id" ON "public"."surgery_type_phase_guidelines" USING "btree" ("surgery_type_id");



CREATE INDEX "idx_surgery_type_signs_type_id" ON "public"."surgery_type_signs" USING "btree" ("surgery_type_id");



CREATE INDEX "idx_surgery_types_is_active" ON "public"."surgery_types" USING "btree" ("is_active");



CREATE UNIQUE INDEX "profiles_phone_unique" ON "public"."profiles" USING "btree" ("phone") WHERE (("phone" IS NOT NULL) AND ("phone" <> ''::"text"));



CREATE OR REPLACE TRIGGER "trg_notify_orientation" AFTER INSERT OR UPDATE OF "content" ON "public"."doctor_orientations" FOR EACH ROW EXECUTE FUNCTION "public"."notify_patient_on_orientation"();



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_surgery_id_fkey" FOREIGN KEY ("surgery_id") REFERENCES "public"."surgeries"("id");



ALTER TABLE ONLY "public"."daily_reports"
    ADD CONSTRAINT "daily_reports_surgery_id_fkey" FOREIGN KEY ("surgery_id") REFERENCES "public"."surgeries"("id");



ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."doctor_orientations"
    ADD CONSTRAINT "doctor_orientations_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."doctor_orientations"
    ADD CONSTRAINT "doctor_orientations_surgery_id_fkey" FOREIGN KEY ("surgery_id") REFERENCES "public"."surgeries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_photos"
    ADD CONSTRAINT "patient_photos_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_photos"
    ADD CONSTRAINT "patient_photos_surgery_id_fkey" FOREIGN KEY ("surgery_id") REFERENCES "public"."surgeries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_surgery_id_fkey" FOREIGN KEY ("surgery_id") REFERENCES "public"."surgeries"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."question_options"
    ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."surgeries"
    ADD CONSTRAINT "surgeries_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."surgeries"
    ADD CONSTRAINT "surgeries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."surgeries"
    ADD CONSTRAINT "surgeries_surgery_type_id_fkey" FOREIGN KEY ("surgery_type_id") REFERENCES "public"."surgery_types"("id");



ALTER TABLE ONLY "public"."surgery_questions"
    ADD CONSTRAINT "surgery_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."surgery_questions"
    ADD CONSTRAINT "surgery_questions_surgery_type_id_fkey" FOREIGN KEY ("surgery_type_id") REFERENCES "public"."surgery_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."surgery_type_phase_guidelines"
    ADD CONSTRAINT "surgery_type_phase_guidelines_surgery_type_id_fkey" FOREIGN KEY ("surgery_type_id") REFERENCES "public"."surgery_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."surgery_type_signs"
    ADD CONSTRAINT "surgery_type_signs_surgery_type_id_fkey" FOREIGN KEY ("surgery_type_id") REFERENCES "public"."surgery_types"("id") ON DELETE CASCADE;



CREATE POLICY "Allow anon read surgery_type_phase_guidelines" ON "public"."surgery_type_phase_guidelines" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anon read surgery_type_signs" ON "public"."surgery_type_signs" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow authenticated read surgery_type_phase_guidelines" ON "public"."surgery_type_phase_guidelines" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read surgery_type_signs" ON "public"."surgery_type_signs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow service insert surgery_type_phase_guidelines" ON "public"."surgery_type_phase_guidelines" FOR INSERT TO "postgres" WITH CHECK (true);



CREATE POLICY "Allow service insert surgery_type_signs" ON "public"."surgery_type_signs" FOR INSERT TO "postgres" WITH CHECK (true);



CREATE POLICY "Anyone can view active surgery types" ON "public"."surgery_types" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Authenticated users can read options" ON "public"."question_options" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read questions" ON "public"."questions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read surgery_questions" ON "public"."surgery_questions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Doctors can delete own orientations" ON "public"."doctor_orientations" FOR DELETE TO "authenticated" USING (("doctor_id" = "auth"."uid"()));



CREATE POLICY "Doctors can insert own orientations" ON "public"."doctor_orientations" FOR INSERT TO "authenticated" WITH CHECK ((("doctor_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."surgeries" "s"
  WHERE (("s"."id" = "doctor_orientations"."surgery_id") AND ("s"."doctor_id" = "auth"."uid"()))))));



CREATE POLICY "Doctors can insert patients" ON "public"."patients" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'doctor'::"text")))));



CREATE POLICY "Doctors can insert surgeries" ON "public"."surgeries" FOR INSERT WITH CHECK (("doctor_id" = "auth"."uid"()));



CREATE POLICY "Doctors can manage their orientations" ON "public"."doctor_orientations" USING ((("doctor_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."surgeries" "s"
  WHERE (("s"."id" = "doctor_orientations"."surgery_id") AND ("s"."patient_id" = "auth"."uid"()))))));



CREATE POLICY "Doctors can update own orientations" ON "public"."doctor_orientations" FOR UPDATE TO "authenticated" USING (("doctor_id" = "auth"."uid"())) WITH CHECK (("doctor_id" = "auth"."uid"()));



CREATE POLICY "Doctors can update their own surgeries" ON "public"."surgeries" FOR UPDATE USING (("doctor_id" = "auth"."uid"()));



CREATE POLICY "Doctors can view alerts" ON "public"."alerts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'doctor'::"text")))));



CREATE POLICY "Doctors can view all patients" ON "public"."patients" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'doctor'::"text")))));



CREATE POLICY "Doctors can view all reports" ON "public"."daily_reports" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'doctor'::"text")))));



CREATE POLICY "Doctors can view own orientations" ON "public"."doctor_orientations" FOR SELECT TO "authenticated" USING ((("doctor_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."patients" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."surgeries" "s"
          WHERE (("s"."id" = "p"."surgery_id") AND ("s"."patient_id" = "p"."id")))))))));



CREATE POLICY "Doctors can view their own surgeries" ON "public"."surgeries" FOR SELECT USING (("doctor_id" = "auth"."uid"()));



CREATE POLICY "Patients can insert own reports" ON "public"."daily_reports" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "surgeries"."patient_id"
   FROM "public"."surgeries"
  WHERE ("surgeries"."id" = "daily_reports"."surgery_id"))));



CREATE POLICY "Patients can insert their own alerts" ON "public"."alerts" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "surgeries"."patient_id"
   FROM "public"."surgeries"
  WHERE ("surgeries"."id" = "alerts"."surgery_id"))));



CREATE POLICY "Patients can read their orientations" ON "public"."doctor_orientations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."surgeries" "s"
  WHERE (("s"."id" = "doctor_orientations"."surgery_id") AND ("s"."patient_id" = "auth"."uid"())))));



CREATE POLICY "Patients can update their own surgeries" ON "public"."surgeries" FOR UPDATE USING (("auth"."uid"() = "patient_id"));



CREATE POLICY "Patients can view own record" ON "public"."patients" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Patients can view own reports" ON "public"."daily_reports" FOR SELECT USING (("auth"."uid"() IN ( SELECT "surgeries"."patient_id"
   FROM "public"."surgeries"
  WHERE ("surgeries"."id" = "daily_reports"."surgery_id"))));



CREATE POLICY "Patients can view their own alerts" ON "public"."alerts" FOR SELECT USING (("auth"."uid"() IN ( SELECT "surgeries"."patient_id"
   FROM "public"."surgeries"
  WHERE ("surgeries"."id" = "alerts"."surgery_id"))));



CREATE POLICY "Patients can view their own surgeries" ON "public"."surgeries" FOR SELECT USING (("patient_id" = "auth"."uid"()));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users manage own device tokens" ON "public"."device_tokens" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users read own notifications" ON "public"."notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users update own notifications" ON "public"."notifications" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."device_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."doctor_orientations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "doctors_select_patient_photos" ON "public"."patient_photos" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."surgeries" "s"
  WHERE (("s"."id" = "patient_photos"."surgery_id") AND ("s"."doctor_id" = "auth"."uid"())))));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patients_delete_own_photos" ON "public"."patient_photos" FOR DELETE USING (("auth"."uid"() = "patient_id"));



CREATE POLICY "patients_insert_own_photos" ON "public"."patient_photos" FOR INSERT WITH CHECK (("auth"."uid"() = "patient_id"));



CREATE POLICY "patients_select_own_photos" ON "public"."patient_photos" FOR SELECT USING (("auth"."uid"() = "patient_id"));



CREATE POLICY "patients_update_own_photos" ON "public"."patient_photos" FOR UPDATE USING (("patient_id" = "auth"."uid"())) WITH CHECK (("patient_id" = "auth"."uid"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."question_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."surgeries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."surgery_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."surgery_type_phase_guidelines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."surgery_type_signs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."surgery_types" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_patient_bypass"("patient_email" "text", "patient_password" "text", "patient_name" "text", "patient_cpf" "text", "patient_sex" "text", "patient_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_patient_bypass"("patient_email" "text", "patient_password" "text", "patient_name" "text", "patient_cpf" "text", "patient_sex" "text", "patient_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_patient_bypass"("patient_email" "text", "patient_password" "text", "patient_name" "text", "patient_cpf" "text", "patient_sex" "text", "patient_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_patient_on_orientation"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_patient_on_orientation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_patient_on_orientation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_patient_profile"("p_patient_id" "uuid", "p_full_name" "text", "p_cpf" "text", "p_phone" "text", "p_sex" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_patient_profile"("p_patient_id" "uuid", "p_full_name" "text", "p_cpf" "text", "p_phone" "text", "p_sex" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_patient_profile"("p_patient_id" "uuid", "p_full_name" "text", "p_cpf" "text", "p_phone" "text", "p_sex" "text") TO "service_role";



GRANT ALL ON TABLE "public"."alerts" TO "anon";
GRANT ALL ON TABLE "public"."alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."alerts" TO "service_role";



GRANT ALL ON TABLE "public"."daily_reports" TO "anon";
GRANT ALL ON TABLE "public"."daily_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_reports" TO "service_role";



GRANT ALL ON TABLE "public"."device_tokens" TO "anon";
GRANT ALL ON TABLE "public"."device_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."device_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."doctor_orientations" TO "anon";
GRANT ALL ON TABLE "public"."doctor_orientations" TO "authenticated";
GRANT ALL ON TABLE "public"."doctor_orientations" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."patient_photos" TO "anon";
GRANT ALL ON TABLE "public"."patient_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_photos" TO "service_role";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."question_options" TO "anon";
GRANT ALL ON TABLE "public"."question_options" TO "authenticated";
GRANT ALL ON TABLE "public"."question_options" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON TABLE "public"."surgeries" TO "anon";
GRANT ALL ON TABLE "public"."surgeries" TO "authenticated";
GRANT ALL ON TABLE "public"."surgeries" TO "service_role";



GRANT ALL ON TABLE "public"."surgery_questions" TO "anon";
GRANT ALL ON TABLE "public"."surgery_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."surgery_questions" TO "service_role";



GRANT ALL ON TABLE "public"."surgery_type_phase_guidelines" TO "anon";
GRANT ALL ON TABLE "public"."surgery_type_phase_guidelines" TO "authenticated";
GRANT ALL ON TABLE "public"."surgery_type_phase_guidelines" TO "service_role";



GRANT ALL ON TABLE "public"."surgery_type_signs" TO "anon";
GRANT ALL ON TABLE "public"."surgery_type_signs" TO "authenticated";
GRANT ALL ON TABLE "public"."surgery_type_signs" TO "service_role";



GRANT ALL ON TABLE "public"."surgery_types" TO "anon";
GRANT ALL ON TABLE "public"."surgery_types" TO "authenticated";
GRANT ALL ON TABLE "public"."surgery_types" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";








-- Local-only wiring: pg_dump --schema public does not include triggers on auth.users.
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Local-only photo bucket: no files are copied from the remote project.
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-photos', 'patient-photos', false)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY local_patient_photos_access ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'patient-photos' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM public.surgeries s
      WHERE s.patient_id::text = (storage.foldername(name))[1] AND s.doctor_id = auth.uid())
  )
)
WITH CHECK (
  bucket_id = 'patient-photos' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM public.surgeries s
      WHERE s.patient_id::text = (storage.foldername(name))[1] AND s.doctor_id = auth.uid())
  )
);
