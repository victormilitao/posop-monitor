import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { PatientTimelineView, TimelineDay } from '../PatientTimelineView';

const mockPush = jest.fn();

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

describe('PatientTimelineView', () => {
  const sampleTimeline: TimelineDay[] = [
    {
      day: 1,
      date: new Date(2026, 3, 16),
      status: 'completed',
      reportId: 'report-1',
    },
    {
      day: 2,
      date: new Date(2026, 3, 17),
      status: 'completed',
      reportId: 'report-2',
      alertSeverity: 'warning',
    },
    {
      day: 3,
      date: new Date(2026, 3, 18),
      status: 'completed',
      reportId: 'report-3',
      alertSeverity: 'critical',
    },
    {
      day: 4,
      date: new Date(2026, 3, 19),
      status: 'missed',
    },
    {
      day: 5,
      date: new Date(2026, 3, 20),
      status: 'pending',
    },
    {
      day: 6,
      date: new Date(2026, 3, 21),
      status: 'future',
    },
  ];

  const baseProps = {
    timeline: sampleTimeline,
    surgeryTypeName: 'Colecistectomia',
    surgeryStatus: 'active',
    patientName: 'Maria Oliveira',
    isLoading: false,
    onConfirmReturn: jest.fn(),
    showReturnModal: false,
    onOpenReturnModal: jest.fn(),
    onCloseReturnModal: jest.fn(),
    isReturnLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar título com tipo de cirurgia', () => {
    render(React.createElement(PatientTimelineView, baseProps));
    expect(screen.getByText('Acompanhando evolução de Colecistectomia')).toBeTruthy();
  });

  it('deve renderizar todos os dias da timeline', () => {
    render(React.createElement(PatientTimelineView, baseProps));
    expect(screen.getByText('Dia 1')).toBeTruthy();
    expect(screen.getByText('Dia 2')).toBeTruthy();
    expect(screen.getByText('Dia 3')).toBeTruthy();
    expect(screen.getByText('Dia 4')).toBeTruthy();
    expect(screen.getByText('Dia 5')).toBeTruthy();
    expect(screen.getByText('Dia 6')).toBeTruthy();
  });

  it('deve mostrar status "Respondido" para dias completos sem alerta', () => {
    render(React.createElement(PatientTimelineView, baseProps));
    expect(screen.getByText('Respondido')).toBeTruthy();
  });

  it('deve mostrar status "Atenção" para dias com alerta warning', () => {
    render(React.createElement(PatientTimelineView, baseProps));
    expect(screen.getByText('Atenção')).toBeTruthy();
  });

  it('deve mostrar status "Crítico" para dias com alerta critical', () => {
    render(React.createElement(PatientTimelineView, baseProps));
    expect(screen.getByText('Crítico')).toBeTruthy();
  });

  it('deve mostrar status "Não respondido" para dias perdidos', () => {
    render(React.createElement(PatientTimelineView, baseProps));
    expect(screen.getByText('Não respondido')).toBeTruthy();
  });

  it('deve mostrar status "Aguardando resposta" para dias pendentes', () => {
    render(React.createElement(PatientTimelineView, baseProps));
    expect(screen.getByText('Aguardando resposta')).toBeTruthy();
  });

  it('deve mostrar status "Futuro" para dias futuros', () => {
    render(React.createElement(PatientTimelineView, baseProps));
    expect(screen.getByText('Futuro')).toBeTruthy();
  });

  it('deve mostrar aviso de retorno pendente quando status é pending_return', () => {
    render(React.createElement(PatientTimelineView, {
      ...baseProps,
      surgeryStatus: 'pending_return',
    }));
    expect(screen.getByText('Pendente Retorno')).toBeTruthy();
    expect(screen.getByText('Toque para confirmar o retorno do paciente')).toBeTruthy();
  });

  it('deve chamar onOpenReturnModal ao pressionar aviso de retorno', () => {
    render(React.createElement(PatientTimelineView, {
      ...baseProps,
      surgeryStatus: 'pending_return',
    }));
    fireEvent.press(screen.getByText('Pendente Retorno'));
    expect(baseProps.onOpenReturnModal).toHaveBeenCalledTimes(1);
  });

  it('deve mostrar loading quando isLoading é true', () => {
    render(React.createElement(PatientTimelineView, { ...baseProps, isLoading: true }));
    expect(screen.queryByText('Dia 1')).toBeNull();
  });

  it('não deve mostrar aviso de retorno quando status é active', () => {
    render(React.createElement(PatientTimelineView, baseProps));
    expect(screen.queryByText('Pendente Retorno')).toBeNull();
  });

  it('deve renderizar texto padrão quando surgeryTypeName não fornecido', () => {
    render(React.createElement(PatientTimelineView, {
      ...baseProps,
      surgeryTypeName: undefined,
    }));
    expect(screen.getByText('Acompanhando evolução de cirurgia')).toBeTruthy();
  });

  it('deve navegar para detalhes do relatório ao pressionar dia completo', () => {
    render(React.createElement(PatientTimelineView, baseProps));
    fireEvent.press(screen.getByText('Dia 1'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/doctor/report-details/[reportId]',
      params: { reportId: 'report-1' },
    });
  });

  it('não deve navegar ao pressionar dia sem reportId', () => {
    const timelineWithoutReport: TimelineDay[] = [
      {
        day: 1,
        date: new Date(2026, 3, 16),
        status: 'completed',
        // no reportId
      },
    ];
    render(React.createElement(PatientTimelineView, {
      ...baseProps,
      timeline: timelineWithoutReport,
    }));
    fireEvent.press(screen.getByText('Dia 1'));
    expect(mockPush).not.toHaveBeenCalled();
  });
});

