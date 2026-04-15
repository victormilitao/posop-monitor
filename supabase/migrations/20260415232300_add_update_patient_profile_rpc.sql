CREATE OR REPLACE FUNCTION update_patient_profile(
  p_patient_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_cpf TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_sex TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
