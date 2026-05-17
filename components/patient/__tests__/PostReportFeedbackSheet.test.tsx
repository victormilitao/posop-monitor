import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react-native';
import { PostReportFeedbackSheet } from '../PostReportFeedbackSheet';

const mockSigns = [
  { id: '1', surgery_type_id: 'st1', category: 'alert', description: 'Febre alta', display_order: 1 },
  { id: '2', surgery_type_id: 'st1', category: 'alert', description: 'Vômitos persistentes', display_order: 2 },
  { id: '3', surgery_type_id: 'st1', category: 'attention', description: 'Dor moderada', display_order: 1 },
  { id: '4', surgery_type_id: 'st1', category: 'normal', description: 'Dor leve nos ombros', display_order: 1 },
  { id: '5', surgery_type_id: 'st1', category: 'normal', description: 'Náuseas leves', display_order: 2 },
];

jest.mock('../../../hooks/useGuidance', () => ({
  useSignsBySurgeryType: jest.fn(() => ({
    data: mockSigns,
    isLoading: false,
  })),
}));

const { useSignsBySurgeryType } = require('../../../hooks/useGuidance');

describe('PostReportFeedbackSheet', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    surgeryTypeId: 'st1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    useSignsBySurgeryType.mockReturnValue({ data: mockSigns, isLoading: false });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve renderizar o título do sheet', () => {
    render(React.createElement(PostReportFeedbackSheet, defaultProps));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Relatório Enviado ✓')).toBeTruthy();
  });

  it('deve renderizar sinais genéricos quando não há alertMessages', () => {
    render(React.createElement(PostReportFeedbackSheet, { ...defaultProps, resultStatus: 'critical' }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Sinais de Alerta')).toBeTruthy();
    expect(screen.getByText('Febre alta')).toBeTruthy();
    expect(screen.getByText('Vômitos persistentes')).toBeTruthy();
  });

  it('deve renderizar alertMessages reais quando fornecidos', () => {
    const alertMessages = ['Febre: Sim', 'A ferida está vermelha: Sim', 'Sangramento: Sim'];
    render(React.createElement(PostReportFeedbackSheet, {
      ...defaultProps,
      resultStatus: 'critical',
      alertMessages,
    }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Sinais de Alerta')).toBeTruthy();
    expect(screen.getByText('Febre: Sim')).toBeTruthy();
    expect(screen.getByText('A ferida está vermelha: Sim')).toBeTruthy();
    expect(screen.getByText('Sangramento: Sim')).toBeTruthy();
    // Generic signs should NOT be shown
    expect(screen.queryByText('Febre alta')).toBeNull();
    expect(screen.queryByText('Vômitos persistentes')).toBeNull();
  });

  it('deve priorizar alertMessages sobre sinais genéricos quando resultStatus é warning', () => {
    const alertMessages = ['Sintoma A: Sim', 'Sintoma B: Sim', 'Sintoma C: Sim'];
    render(React.createElement(PostReportFeedbackSheet, {
      ...defaultProps,
      resultStatus: 'warning',
      alertMessages,
    }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Sinais de Atenção')).toBeTruthy();
    expect(screen.getByText('Sintoma A: Sim')).toBeTruthy();
    // Generic signs should NOT be shown
    expect(screen.queryByText('Dor moderada')).toBeNull();
  });

  it('deve renderizar mensagem de normalidade quando stable sem alertMessages', () => {
    render(React.createElement(PostReportFeedbackSheet, { ...defaultProps, resultStatus: 'stable' }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Sinais de Normalidade')).toBeTruthy();
    expect(screen.getByText('Suas respostas não indicaram sinais de alerta. Continue seguindo as orientações médicas.')).toBeTruthy();
  });

  it('deve não buscar sinais genéricos quando alertMessages são fornecidos', () => {
    const alertMessages = ['Febre: Sim'];
    render(React.createElement(PostReportFeedbackSheet, {
      ...defaultProps,
      resultStatus: 'critical',
      alertMessages,
    }));
    act(() => { jest.runAllTimers(); });
    // Should call useSignsBySurgeryType with null (to skip the fetch)
    expect(useSignsBySurgeryType).toHaveBeenCalledWith(null);
  });

  it('deve mostrar subtítulo contextual para critical', () => {
    render(React.createElement(PostReportFeedbackSheet, { ...defaultProps, resultStatus: 'critical' }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Atenção! Identificamos sinais que requerem cuidado.')).toBeTruthy();
  });

  it('deve mostrar subtítulo contextual para warning', () => {
    render(React.createElement(PostReportFeedbackSheet, { ...defaultProps, resultStatus: 'warning' }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Alguns sinais merecem sua atenção.')).toBeTruthy();
  });

  it('deve mostrar subtítulo contextual para stable', () => {
    render(React.createElement(PostReportFeedbackSheet, { ...defaultProps, resultStatus: 'stable' }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Suas respostas indicam recuperação dentro do esperado.')).toBeTruthy();
  });

  it('deve chamar onClose ao pressionar botão Entendi', () => {
    render(React.createElement(PostReportFeedbackSheet, defaultProps));
    act(() => { jest.runAllTimers(); });
    fireEvent.press(screen.getByText('Entendi'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('não deve renderizar quando visible false', () => {
    const { toJSON } = render(
      React.createElement(PostReportFeedbackSheet, { ...defaultProps, visible: false }),
    );
    act(() => { jest.runAllTimers(); });
    expect(toJSON()).toBeNull();
  });

  it('deve mostrar loading quando isLoading true e sem alertMessages', () => {
    useSignsBySurgeryType.mockReturnValue({ data: [], isLoading: true });
    render(React.createElement(PostReportFeedbackSheet, { ...defaultProps, resultStatus: 'critical' }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Carregando orientações...')).toBeTruthy();
  });

  it('não deve renderizar categoria sem sinais genéricos', () => {
    const onlyAlerts = [
      { id: '1', surgery_type_id: 'st1', category: 'alert', description: 'Febre', display_order: 1 },
    ];
    useSignsBySurgeryType.mockReturnValue({ data: onlyAlerts, isLoading: false });
    render(React.createElement(PostReportFeedbackSheet, { ...defaultProps, resultStatus: 'critical' }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Sinais de Alerta')).toBeTruthy();
    expect(screen.queryByText('Sinais de Atenção')).toBeNull();
    expect(screen.queryByText('Sinais de Normalidade')).toBeNull();
  });

  it('deve renderizar alertMessages vazios como stable sem alertas', () => {
    render(React.createElement(PostReportFeedbackSheet, {
      ...defaultProps,
      resultStatus: 'stable',
      alertMessages: [],
    }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Sinais de Normalidade')).toBeTruthy();
  });
});
