import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { PatientListItem } from '../PatientListItem';

describe('PatientListItem', () => {
  const baseProps = {
    name: 'João Silva',
    surgeryDate: '20/03/2026',
    day: 5,
    status: 'stable' as const,
    lastResponseDate: '2026-03-22',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar nome e data da cirurgia', () => {
    render(React.createElement(PatientListItem, baseProps));
    expect(screen.getByText('João Silva')).toBeTruthy();
    expect(screen.getByText('Data da Cirurgia: 20/03/2026')).toBeTruthy();
  });

  it('deve exibir tipo de cirurgia e data em linhas separadas quando surgeryType fornecido', () => {
    render(React.createElement(PatientListItem, { ...baseProps, surgeryType: 'Histerectomia' }));
    expect(screen.getByText('Cirurgia: Histerectomia')).toBeTruthy();
    expect(screen.getByText('Data da Cirurgia: 20/03/2026')).toBeTruthy();
  });

  it('deve renderizar badge com dia correto', () => {
    render(React.createElement(PatientListItem, baseProps));
    expect(screen.getByText('Dia 5')).toBeTruthy();
  });

  it('deve chamar onPress ao tocar', () => {
    render(React.createElement(PatientListItem, baseProps));
    fireEvent.press(screen.getByText('João Silva'));
    expect(baseProps.onPress).toHaveBeenCalled();
  });

  it('deve exibir status Crítico', () => {
    render(React.createElement(PatientListItem, { ...baseProps, status: 'critical' }));
    expect(screen.getByText('Crítico')).toBeTruthy();
  });

  it('deve exibir status Atenção', () => {
    render(React.createElement(PatientListItem, { ...baseProps, status: 'warning' }));
    expect(screen.getByText('Atenção')).toBeTruthy();
  });

  it('deve exibir status Finalizado sem linha de resposta', () => {
    render(React.createElement(PatientListItem, { ...baseProps, status: 'finished' }));
    expect(screen.getByText('Dia 5')).toBeTruthy();
    // finished status hides the bottom area
    expect(screen.queryByText(/Última resposta/)).toBeNull();
  });

  it('deve exibir status Pendente Retorno com indicador visual', () => {
    render(React.createElement(PatientListItem, { ...baseProps, status: 'pending_return' }));
    expect(screen.getByText('Dia 5')).toBeTruthy();
    expect(screen.getAllByText('Pendente Retorno').length).toBeGreaterThan(0);
  });

  it('deve exibir Pendente Retorno no rodapé e não ocultar seção de resposta', () => {
    render(React.createElement(PatientListItem, { ...baseProps, status: 'pending_return', lastResponseDate: '2026-03-22' }));
    expect(screen.getAllByText('Pendente Retorno').length).toBeGreaterThan(0);
    expect(screen.getByText(/Última resposta/)).toBeTruthy();
  });

  it('deve exibir alertas quando fornecidos', () => {
    render(
      React.createElement(PatientListItem, { ...baseProps, alerts: ['Dor alta', 'Febre'] }),
    );
    expect(screen.getByText('• Dor alta')).toBeTruthy();
    expect(screen.getByText('• Febre')).toBeTruthy();
  });

  it('deve exibir "Sem respostas" quando lastResponseDate é null', () => {
    render(
      React.createElement(PatientListItem, { ...baseProps, lastResponseDate: null }),
    );
    expect(screen.getByText('Sem respostas')).toBeTruthy();
  });
});
