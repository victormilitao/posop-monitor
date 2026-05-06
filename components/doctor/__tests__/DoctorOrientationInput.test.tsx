import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { DoctorOrientationInput } from '../DoctorOrientationInput';

describe('DoctorOrientationInput', () => {
  const mockOnSend = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const defaultProps = {
    orientations: [],
    isLoading: false,
    isSending: false,
    onSend: mockOnSend,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    isEditing: false,
    isDeleting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar botão de adicionar orientação', () => {
    render(React.createElement(DoctorOrientationInput, defaultProps));
    expect(screen.getByTestId('add-orientation-button')).toBeTruthy();
    expect(screen.getByText('Adicionar orientação ao paciente')).toBeTruthy();
  });

  it('deve expandir input ao clicar no botão de adicionar', () => {
    render(React.createElement(DoctorOrientationInput, defaultProps));
    fireEvent.press(screen.getByTestId('add-orientation-button'));
    expect(screen.getByTestId('orientation-text-input')).toBeTruthy();
    expect(screen.getByText('Nova orientação')).toBeTruthy();
  });

  it('deve mostrar contador de caracteres restantes', () => {
    render(React.createElement(DoctorOrientationInput, defaultProps));
    fireEvent.press(screen.getByTestId('add-orientation-button'));
    expect(screen.getByText('300 caracteres restantes')).toBeTruthy();
  });

  it('deve atualizar contador ao digitar', () => {
    render(React.createElement(DoctorOrientationInput, defaultProps));
    fireEvent.press(screen.getByTestId('add-orientation-button'));
    fireEvent.changeText(screen.getByTestId('orientation-text-input'), 'Teste');
    expect(screen.getByText('295 caracteres restantes')).toBeTruthy();
  });

  it('deve chamar onSend com texto ao pressionar Enviar', () => {
    render(React.createElement(DoctorOrientationInput, defaultProps));
    fireEvent.press(screen.getByTestId('add-orientation-button'));
    fireEvent.changeText(screen.getByTestId('orientation-text-input'), 'Minha orientação');
    fireEvent.press(screen.getByTestId('send-orientation-button'));
    expect(mockOnSend).toHaveBeenCalledWith('Minha orientação');
  });

  it('não deve chamar onSend com texto vazio', () => {
    render(React.createElement(DoctorOrientationInput, defaultProps));
    fireEvent.press(screen.getByTestId('add-orientation-button'));
    fireEvent.press(screen.getByTestId('send-orientation-button'));
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('não deve chamar onSend com texto apenas de espaços', () => {
    render(React.createElement(DoctorOrientationInput, defaultProps));
    fireEvent.press(screen.getByTestId('add-orientation-button'));
    fireEvent.changeText(screen.getByTestId('orientation-text-input'), '   ');
    fireEvent.press(screen.getByTestId('send-orientation-button'));
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('deve fechar input ao clicar no X', () => {
    render(React.createElement(DoctorOrientationInput, defaultProps));
    fireEvent.press(screen.getByTestId('add-orientation-button'));
    expect(screen.getByTestId('orientation-text-input')).toBeTruthy();
    fireEvent.press(screen.getByTestId('close-orientation-input'));
    expect(screen.queryByTestId('orientation-text-input')).toBeNull();
  });

  it('deve renderizar orientações existentes', () => {
    const orientations = [
      {
        id: 'o1',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Descanse bastante hoje',
        created_at: '2026-05-06T10:00:00Z',
        updated_at: null,
      },
      {
        id: 'o2',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Tome os medicamentos no horário',
        created_at: '2026-05-05T10:00:00Z',
        updated_at: null,
      },
    ];

    render(React.createElement(DoctorOrientationInput, { ...defaultProps, orientations }));
    expect(screen.getByText('Descanse bastante hoje')).toBeTruthy();
    expect(screen.getByText('Tome os medicamentos no horário')).toBeTruthy();
    expect(screen.getByText('Orientações enviadas')).toBeTruthy();
  });

  it('deve chamar onDelete ao pressionar botão de deletar', () => {
    const orientations = [
      {
        id: 'o1',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Descanse bastante',
        created_at: '2026-05-06T10:00:00Z',
        updated_at: null,
      },
    ];

    render(React.createElement(DoctorOrientationInput, { ...defaultProps, orientations }));
    fireEvent.press(screen.getByTestId('delete-orientation-o1'));
    expect(mockOnDelete).toHaveBeenCalledWith('o1');
  });

  it('não deve mostrar seção de orientações quando lista está vazia', () => {
    render(React.createElement(DoctorOrientationInput, defaultProps));
    expect(screen.queryByText('Orientações enviadas')).toBeNull();
  });

  it('deve limpar input após envio bem-sucedido', () => {
    render(React.createElement(DoctorOrientationInput, defaultProps));
    fireEvent.press(screen.getByTestId('add-orientation-button'));
    fireEvent.changeText(screen.getByTestId('orientation-text-input'), 'Teste envio');
    fireEvent.press(screen.getByTestId('send-orientation-button'));
    // Input should be closed after send
    expect(screen.queryByTestId('orientation-text-input')).toBeNull();
  });

  // ---- Edit tests ----

  it('deve mostrar botão de editar em cada orientação', () => {
    const orientations = [
      {
        id: 'o1',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Orientação de teste',
        created_at: '2026-05-06T10:00:00Z',
        updated_at: null,
      },
    ];

    render(React.createElement(DoctorOrientationInput, { ...defaultProps, orientations }));
    expect(screen.getByTestId('edit-orientation-o1')).toBeTruthy();
  });

  it('deve entrar no modo de edição ao pressionar botão de editar', () => {
    const orientations = [
      {
        id: 'o1',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Orientação original',
        created_at: '2026-05-06T10:00:00Z',
        updated_at: null,
      },
    ];

    render(React.createElement(DoctorOrientationInput, { ...defaultProps, orientations }));
    fireEvent.press(screen.getByTestId('edit-orientation-o1'));
    expect(screen.getByTestId('orientation-edit-o1')).toBeTruthy();
    expect(screen.getByTestId('orientation-edit-input-o1')).toBeTruthy();
  });

  it('deve preencher input de edição com conteúdo atual', () => {
    const orientations = [
      {
        id: 'o1',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Orientação original',
        created_at: '2026-05-06T10:00:00Z',
        updated_at: null,
      },
    ];

    render(React.createElement(DoctorOrientationInput, { ...defaultProps, orientations }));
    fireEvent.press(screen.getByTestId('edit-orientation-o1'));
    const input = screen.getByTestId('orientation-edit-input-o1');
    expect(input.props.value).toBe('Orientação original');
  });

  it('deve chamar onEdit com dados corretos ao salvar edição', () => {
    const orientations = [
      {
        id: 'o1',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Orientação original',
        created_at: '2026-05-06T10:00:00Z',
        updated_at: null,
      },
    ];

    render(React.createElement(DoctorOrientationInput, { ...defaultProps, orientations }));
    fireEvent.press(screen.getByTestId('edit-orientation-o1'));
    fireEvent.changeText(screen.getByTestId('orientation-edit-input-o1'), 'Orientação editada');
    fireEvent.press(screen.getByTestId('save-edit-o1'));
    expect(mockOnEdit).toHaveBeenCalledWith('o1', 'Orientação editada');
  });

  it('deve cancelar edição ao pressionar botão de cancelar', () => {
    const orientations = [
      {
        id: 'o1',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Orientação original',
        created_at: '2026-05-06T10:00:00Z',
        updated_at: null,
      },
    ];

    render(React.createElement(DoctorOrientationInput, { ...defaultProps, orientations }));
    fireEvent.press(screen.getByTestId('edit-orientation-o1'));
    expect(screen.getByTestId('orientation-edit-o1')).toBeTruthy();
    fireEvent.press(screen.getByTestId('cancel-edit-o1'));
    // Should return to view mode
    expect(screen.queryByTestId('orientation-edit-o1')).toBeNull();
    expect(screen.getByText('Orientação original')).toBeTruthy();
  });

  it('não deve chamar onEdit quando texto editado está vazio', () => {
    const orientations = [
      {
        id: 'o1',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Orientação original',
        created_at: '2026-05-06T10:00:00Z',
        updated_at: null,
      },
    ];

    render(React.createElement(DoctorOrientationInput, { ...defaultProps, orientations }));
    fireEvent.press(screen.getByTestId('edit-orientation-o1'));
    fireEvent.changeText(screen.getByTestId('orientation-edit-input-o1'), '');
    fireEvent.press(screen.getByTestId('save-edit-o1'));
    expect(mockOnEdit).not.toHaveBeenCalled();
  });

  it('não deve chamar onEdit quando texto editado contém apenas espaços', () => {
    const orientations = [
      {
        id: 'o1',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Orientação original',
        created_at: '2026-05-06T10:00:00Z',
        updated_at: null,
      },
    ];

    render(React.createElement(DoctorOrientationInput, { ...defaultProps, orientations }));
    fireEvent.press(screen.getByTestId('edit-orientation-o1'));
    fireEvent.changeText(screen.getByTestId('orientation-edit-input-o1'), '   ');
    fireEvent.press(screen.getByTestId('save-edit-o1'));
    expect(mockOnEdit).not.toHaveBeenCalled();
  });

  it('deve sair do modo de edição após salvar', () => {
    const orientations = [
      {
        id: 'o1',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Orientação original',
        created_at: '2026-05-06T10:00:00Z',
        updated_at: null,
      },
    ];

    render(React.createElement(DoctorOrientationInput, { ...defaultProps, orientations }));
    fireEvent.press(screen.getByTestId('edit-orientation-o1'));
    fireEvent.changeText(screen.getByTestId('orientation-edit-input-o1'), 'Nova versão');
    fireEvent.press(screen.getByTestId('save-edit-o1'));
    expect(screen.queryByTestId('orientation-edit-o1')).toBeNull();
  });
});
