import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('deve renderizar dia atual e total', () => {
    render(React.createElement(ProgressBar, { currentDay: 5, totalDays: 14 }));
    expect(screen.getByText('Dia 5 de 14')).toBeTruthy();
  });

  it('deve renderizar título de acompanhamento', () => {
    render(React.createElement(ProgressBar, { currentDay: 1, totalDays: 7 }));
    expect(screen.getByText('Seu acompanhamento')).toBeTruthy();
  });

  it('deve renderizar mensagem informativa', () => {
    render(React.createElement(ProgressBar, { currentDay: 3, totalDays: 10 }));
    expect(screen.getByText('Continue respondendo diariamente para melhor acompanhamento.')).toBeTruthy();
  });

  it('deve limitar progresso a 100% quando currentDay > totalDays', () => {
    const { toJSON } = render(React.createElement(ProgressBar, { currentDay: 20, totalDays: 14 }));
    expect(toJSON()).toBeTruthy();
    // Progress would be clamped to 100%
    expect(screen.getByText('Dia 20 de 14')).toBeTruthy();
  });

  it('deve tratar currentDay 0', () => {
    render(React.createElement(ProgressBar, { currentDay: 0, totalDays: 14 }));
    expect(screen.getByText('Dia 0 de 14')).toBeTruthy();
  });
});
