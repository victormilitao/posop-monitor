import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';

const mockProfile = { id: 'doc-1', full_name: 'Dr. Silva', role: 'doctor' };
const mockSurgeryTypes = [
  { id: 'st1', name: 'Artroscopia', is_active: true },
  { id: 'st2', name: 'Hernioplastia', is_active: true },
];

const mockCreatePatient = jest.fn();

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ profile: mockProfile }),
}));

jest.mock('../../../hooks/useSurgeryTypes', () => ({
  useSurgeryTypes: () => ({
    data: mockSurgeryTypes,
    isLoading: false,
  }),
}));

jest.mock('../../../services', () => ({
  patientService: {
    createPatient: (...args: any[]) => mockCreatePatient(...args),
  },
}));

import { AddPatientModal } from '../AddPatientModal';

describe('AddPatientModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o modal quando visível', () => {
    render(React.createElement(AddPatientModal, defaultProps));
    expect(screen.getByText('Adicionar Paciente')).toBeTruthy();
  });

  it('deve mostrar campos do formulário', () => {
    render(React.createElement(AddPatientModal, defaultProps));
    expect(screen.getByText('Nome:')).toBeTruthy();
    expect(screen.getByText('E-mail corporativo/pessoal:')).toBeTruthy();
    expect(screen.getByText('Tipo de Cirurgia:')).toBeTruthy();
  });

  it('deve chamar onClose ao pressionar Cancelar', () => {
    render(React.createElement(AddPatientModal, defaultProps));
    fireEvent.press(screen.getByText('Cancelar'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('deve preencher nome e email', () => {
    render(React.createElement(AddPatientModal, defaultProps));

    const nameInput = screen.getByPlaceholderText('Nome completo do paciente...');
    const emailInput = screen.getByPlaceholderText('E-mail para login do paciente...');

    fireEvent.changeText(nameInput, 'João');
    fireEvent.changeText(emailInput, 'joao@test.com');

    expect(nameInput.props.value).toBe('João');
    expect(emailInput.props.value).toBe('joao@test.com');
  });

  it('deve abrir dropdown de tipo de cirurgia e selecionar', () => {
    render(React.createElement(AddPatientModal, defaultProps));

    fireEvent.press(screen.getByText('Selecione a cirurgia...'));
    fireEvent.press(screen.getByText('Artroscopia'));

    expect(screen.getByText('Artroscopia')).toBeTruthy();
  });

  it('deve mostrar erro quando campos obrigatórios não preenchidos', async () => {
    render(React.createElement(AddPatientModal, { ...defaultProps }));

    // Clear the auto-populated date
    const dateInput = screen.getByPlaceholderText('DD/MM/AAAA');
    fireEvent.changeText(dateInput, '');

    fireEvent.press(screen.getByText('Adicionar'));

    await waitFor(() => {
      expect(screen.getByText('Por favor, preencha todos os campos obrigatórios (Nome, Email, Tipo de Cirurgia, Data).')).toBeTruthy();
    });
  });

  it('deve submeter com sucesso', async () => {
    mockCreatePatient.mockResolvedValue({ patientId: 'p-new', surgeryId: 's-new' });

    render(React.createElement(AddPatientModal, defaultProps));

    fireEvent.changeText(screen.getByPlaceholderText('Nome completo do paciente...'), 'João Silva');
    fireEvent.changeText(screen.getByPlaceholderText('E-mail para login do paciente...'), 'joao@test.com');

    fireEvent.press(screen.getByText('Selecione a cirurgia...'));
    fireEvent.press(screen.getByText('Artroscopia'));

    fireEvent.press(screen.getByText('Adicionar'));

    await waitFor(() => {
      expect(mockCreatePatient).toHaveBeenCalled();
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('deve mostrar erro quando data tem formato errado', async () => {
    render(React.createElement(AddPatientModal, defaultProps));

    fireEvent.changeText(screen.getByPlaceholderText('Nome completo do paciente...'), 'João');
    fireEvent.changeText(screen.getByPlaceholderText('E-mail para login do paciente...'), 'j@t.com');
    fireEvent.press(screen.getByText('Selecione a cirurgia...'));
    fireEvent.press(screen.getByText('Artroscopia'));

    fireEvent.changeText(screen.getByPlaceholderText('DD/MM/AAAA'), '123');

    fireEvent.press(screen.getByText('Adicionar'));

    await waitFor(() => {
      expect(screen.getByText('Formato de data inválido. Use DD/MM/AAAA.')).toBeTruthy();
    });
  });

  it('deve mostrar erro quando data inválida', async () => {
    render(React.createElement(AddPatientModal, defaultProps));

    fireEvent.changeText(screen.getByPlaceholderText('Nome completo do paciente...'), 'João');
    fireEvent.changeText(screen.getByPlaceholderText('E-mail para login do paciente...'), 'j@t.com');
    fireEvent.press(screen.getByText('Selecione a cirurgia...'));
    fireEvent.press(screen.getByText('Artroscopia'));

    fireEvent.changeText(screen.getByPlaceholderText('DD/MM/AAAA'), '99/99/9999');

    fireEvent.press(screen.getByText('Adicionar'));

    await waitFor(() => {
      expect(screen.getByText('Data inválida. Verifique o dia, mês e ano informados.')).toBeTruthy();
    });
  });

  it('deve mostrar erro quando createPatient falha', async () => {
    mockCreatePatient.mockRejectedValue(new Error('CPF duplicado'));

    render(React.createElement(AddPatientModal, defaultProps));

    fireEvent.changeText(screen.getByPlaceholderText('Nome completo do paciente...'), 'João');
    fireEvent.changeText(screen.getByPlaceholderText('E-mail para login do paciente...'), 'j@t.com');
    fireEvent.press(screen.getByText('Selecione a cirurgia...'));
    fireEvent.press(screen.getByText('Artroscopia'));

    fireEvent.press(screen.getByText('Adicionar'));

    await waitFor(() => {
      expect(screen.getByText('CPF duplicado')).toBeTruthy();
    });
  });
});
