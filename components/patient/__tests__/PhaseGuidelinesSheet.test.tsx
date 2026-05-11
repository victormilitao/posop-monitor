import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { PhaseGuidelinesSheet } from '../PhaseGuidelinesSheet';

// Mock usePhaseGuidelines hook
const mockPhaseData = [
  {
    id: '1',
    surgery_type_id: 'st1',
    phase_start_day: 0,
    phase_end_day: 3,
    phase_title: 'Dias 0 a 3 – Adaptação Inicial',
    phase_subtitle: 'Seu corpo está se ajustando à cirurgia.',
    items: ['Descanse bastante.', 'Caminhe pequenas distâncias.'],
    highlight_text: 'O mais importante agora é descanso.',
    display_order: 1,
  },
  {
    id: '2',
    surgery_type_id: 'st1',
    phase_start_day: 4,
    phase_end_day: 7,
    phase_title: 'Dias 4 a 7 – Recuperação Progressiva',
    phase_subtitle: 'A cada dia, melhora gradual.',
    items: ['A dor tende a diminuir.', 'A alimentação fica mais fácil.'],
    highlight_text: 'Se algo piorar, avise pelo aplicativo.',
    display_order: 2,
  },
  {
    id: '3',
    surgery_type_id: 'st1',
    phase_start_day: 8,
    phase_end_day: 14,
    phase_title: 'Dias 8 a 14 – Consolidação',
    phase_subtitle: 'Fase final da recuperação inicial.',
    items: ['Retorno gradual às atividades.', 'Menor necessidade de analgésicos.'],
    highlight_text: 'Prepara você para o retorno presencial.',
    display_order: 3,
  },
];

const mockOrientations = [
  {
    id: 'o1',
    surgery_id: 's1',
    doctor_id: 'd1',
    content: 'Descanse mais no período da tarde.',
    created_at: '2026-05-06T10:00:00Z',
    updated_at: null,
  },
];

jest.mock('../../../hooks/useGuidance', () => ({
  usePhaseGuidelines: jest.fn(() => ({
    data: mockPhaseData,
    isLoading: false,
  })),
}));

jest.mock('../../../hooks/useOrientations', () => ({
  useOrientationsBySurgery: jest.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

const { usePhaseGuidelines } = require('../../../hooks/useGuidance');
const { useOrientationsBySurgery } = require('../../../hooks/useOrientations');

describe('PhaseGuidelinesSheet', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    currentDay: 1,
    surgeryTypeId: 'st1',
    surgeryId: 's1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    usePhaseGuidelines.mockReturnValue({ data: mockPhaseData, isLoading: false });
    useOrientationsBySurgery.mockReturnValue({ data: [], isLoading: false });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve renderizar conteúdo da fase 0-3 quando currentDay <= 3', () => {
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 2 }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Orientações por Fase')).toBeTruthy();
    expect(screen.getByText('Dias 0 a 3 – Adaptação Inicial')).toBeTruthy();
  });

  it('deve renderizar conteúdo da fase 4-7 quando currentDay entre 4 e 7', () => {
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 5 }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Dias 4 a 7 – Recuperação Progressiva')).toBeTruthy();
  });

  it('deve renderizar conteúdo da fase 8-14 quando currentDay > 7', () => {
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 10 }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Dias 8 a 14 – Consolidação')).toBeTruthy();
  });

  it('deve renderizar primeira fase quando currentDay undefined', () => {
    render(React.createElement(PhaseGuidelinesSheet, { visible: true, onClose: jest.fn(), surgeryTypeId: 'st1', surgeryId: 's1' }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Dias 0 a 3 – Adaptação Inicial')).toBeTruthy();
  });

  it('não deve renderizar quando visible false e não montado', () => {
    const { toJSON } = render(
      React.createElement(PhaseGuidelinesSheet, { visible: false, onClose: jest.fn(), currentDay: 1, surgeryTypeId: 'st1', surgeryId: 's1' }),
    );
    act(() => { jest.runAllTimers(); });
    expect(toJSON()).toBeNull();
  });

  it('deve renderizar items da fase ativa', () => {
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 1 }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Descanse bastante.')).toBeTruthy();
    expect(screen.getByText('Caminhe pequenas distâncias.')).toBeTruthy();
  });

  it('deve renderizar highlight_text da fase ativa', () => {
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 5 }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Se algo piorar, avise pelo aplicativo.')).toBeTruthy();
  });

  it('deve renderizar subtitle da fase ativa entre aspas', () => {
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 10 }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText(/"Fase final da recuperação inicial."/)).toBeTruthy();
  });

  it('deve mostrar label da fase atual', () => {
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 5 }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText(/Dias 4 a 7 – Recuperação Progressiva \(Fase Atual\)/)).toBeTruthy();
  });

  it('deve atualizar fase quando currentDay muda', () => {
    const { rerender } = render(
      React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 2 }),
    );
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Dias 0 a 3 – Adaptação Inicial')).toBeTruthy();

    rerender(React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 10 }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Dias 8 a 14 – Consolidação')).toBeTruthy();
  });

  it('deve mostrar loading quando isLoading true', () => {
    usePhaseGuidelines.mockReturnValue({ data: [], isLoading: true });
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Carregando orientações...')).toBeTruthy();
  });

  it('deve mostrar mensagem vazia quando não há dados', () => {
    usePhaseGuidelines.mockReturnValue({ data: [], isLoading: false });
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Nenhuma orientação disponível.')).toBeTruthy();
  });

  it('deve usar última fase quando currentDay excede todas as fases', () => {
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 30 }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Dias 8 a 14 – Consolidação')).toBeTruthy();
  });

  // Doctor orientations tests
  it('deve renderizar orientações do médico quando existem', () => {
    useOrientationsBySurgery.mockReturnValue({ data: mockOrientations, isLoading: false });
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByTestId('doctor-orientations-section')).toBeTruthy();
    expect(screen.getByText('Descanse mais no período da tarde.')).toBeTruthy();
    expect(screen.getByText('Orientação do seu médico')).toBeTruthy();
  });

  it('não deve renderizar seção de orientações quando lista está vazia', () => {
    useOrientationsBySurgery.mockReturnValue({ data: [], isLoading: false });
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps }));
    act(() => { jest.runAllTimers(); });
    expect(screen.queryByTestId('doctor-orientations-section')).toBeNull();
  });

  it('deve renderizar múltiplas orientações do médico', () => {
    const multipleOrientations = [
      ...mockOrientations,
      {
        id: 'o2',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Evite alimentos gordurosos.',
        created_at: '2026-05-05T10:00:00Z',
        updated_at: null,
      },
    ];
    useOrientationsBySurgery.mockReturnValue({ data: multipleOrientations, isLoading: false });
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Descanse mais no período da tarde.')).toBeTruthy();
    expect(screen.getByText('Evite alimentos gordurosos.')).toBeTruthy();
  });
});

