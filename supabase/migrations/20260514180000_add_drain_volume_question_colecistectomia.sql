-- ============================================================
-- Migration: add_drain_volume_question_colecistectomia
-- 1. Adiciona 'numeric' ao check constraint de input_type
-- 2. Cria pergunta "Volume retirado do dreno" para Colecistectomia
-- ============================================================

-- 1. Atualizar check constraint para aceitar 'numeric'
ALTER TABLE questions DROP CONSTRAINT questions_input_type_check;
ALTER TABLE questions ADD CONSTRAINT questions_input_type_check
  CHECK (input_type = ANY (ARRAY['text', 'scale', 'select', 'multiselect', 'boolean', 'numeric']));

-- 2. Criar a pergunta com input_type = 'numeric' e metadata configurada
INSERT INTO questions (id, text, input_type, is_active, metadata)
VALUES (
  gen_random_uuid(),
  'Volume retirado do dreno',
  'numeric',
  true,
  '{
    "min": 0,
    "max": 999,
    "step": 10,
    "unit": "ml",
    "allow_above_max": true,
    "above_max_label": "Maior que 999ml",
    "above_max_value": ">999",
    "abnormal_min": 500,
    "category": "warning"
  }'
);

-- 3. Vincular a pergunta ao tipo Colecistectomia
-- Usa display_order dinâmico baseado no max existente
INSERT INTO surgery_questions (id, surgery_type_id, question_id, display_order, is_active)
SELECT
  gen_random_uuid(),
  st.id,
  q.id,
  COALESCE(
    (SELECT MAX(sq.display_order) FROM surgery_questions sq WHERE sq.surgery_type_id = st.id),
    0
  ) + 1,
  true
FROM surgery_types st, questions q
WHERE st.name LIKE 'Colecistectomia%'
  AND q.text = 'Volume retirado do dreno';
