import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { PhaseGuidelinesSheet } from '../PhaseGuidelinesSheet';

describe('PhaseGuidelinesSheet', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    currentDay: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
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
    expect(screen.getByText('Dias 8 a 14 – Consolidação da Recuperação')).toBeTruthy();
  });

  it('deve renderizar fase 0-3 quando currentDay undefined', () => {
    render(React.createElement(PhaseGuidelinesSheet, { visible: true, onClose: jest.fn() }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Dias 0 a 3 – Adaptação Inicial')).toBeTruthy();
  });

  it('não deve renderizar quando visible false e não montado', () => {
    const { toJSON } = render(
      React.createElement(PhaseGuidelinesSheet, { visible: false, onClose: jest.fn(), currentDay: 1 }),
    );
    act(() => { jest.runAllTimers(); });
    expect(toJSON()).toBeNull();
  });

  it('deve renderizar guidelines da fase 0-3', () => {
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 1 }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Descanse, mas não fique o tempo todo deitado.')).toBeTruthy();
    expect(screen.getByText('Caminhe pequenas distâncias várias vezes ao dia.')).toBeTruthy();
  });

  it('deve renderizar guidelines da fase 4-7', () => {
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 5 }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('A dor tende a diminuir.')).toBeTruthy();
    expect(screen.getByText('A alimentação fica mais fácil.')).toBeTruthy();
  });

  it('deve renderizar guidelines da fase 8-14', () => {
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 10 }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Retorno gradual às atividades habituais.')).toBeTruthy();
    expect(screen.getByText('Menor necessidade de analgésicos.')).toBeTruthy();
  });

  it('deve mostrar fase label atual', () => {
    render(React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 5 }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText(/Dias 4-7 \(Fase Atual\)/)).toBeTruthy();
  });

  it('deve atualizar fase quando currentDay muda', () => {
    const { rerender } = render(
      React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 2 }),
    );
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Dias 0 a 3 – Adaptação Inicial')).toBeTruthy();

    rerender(React.createElement(PhaseGuidelinesSheet, { ...defaultProps, currentDay: 10 }));
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Dias 8 a 14 – Consolidação da Recuperação')).toBeTruthy();
  });
});
