-- ============================================================
-- Migration: add_applicable_sex_to_surgery_types
-- Adiciona restrição de sexo aplicável ao tipo de cirurgia.
-- Valores possíveis: 'M' (masculino), 'F' (feminino), 'both' (ambos).
-- Default 'both' garante compatibilidade retroativa.
-- ============================================================

ALTER TABLE surgery_types
  ADD COLUMN applicable_sex TEXT NOT NULL DEFAULT 'both'
  CONSTRAINT surgery_types_applicable_sex_check CHECK (applicable_sex IN ('M', 'F', 'both'));

-- Histerectomia é exclusiva para pacientes do sexo feminino
UPDATE surgery_types
  SET applicable_sex = 'F'
  WHERE name = 'Histerectomia';
