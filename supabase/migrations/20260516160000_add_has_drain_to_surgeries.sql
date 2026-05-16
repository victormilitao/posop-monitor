-- ============================================================
-- Migration: add_has_drain_to_surgeries
-- 1. Adiciona coluna has_drain à tabela surgeries
-- 2. Marca a pergunta "Volume retirado do dreno" com requires_drain no metadata
-- ============================================================

-- 1. Adicionar coluna has_drain à tabela surgeries
ALTER TABLE surgeries ADD COLUMN has_drain boolean NOT NULL DEFAULT false;

-- 2. Atualizar metadata da pergunta "Volume retirado do dreno" para incluir requires_drain
UPDATE questions
SET metadata = jsonb_set(
  COALESCE(metadata::jsonb, '{}'::jsonb),
  '{requires_drain}',
  'true'::jsonb
)
WHERE text = 'Volume retirado do dreno';
