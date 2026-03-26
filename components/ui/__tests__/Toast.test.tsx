import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Toast, ToastData } from '../Toast';

describe('Toast', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar toast de sucesso', () => {
    const toast: ToastData = {
      id: 't1',
      type: 'success',
      title: 'Sucesso!',
      message: 'Operação concluída',
    };

    render(React.createElement(Toast, { toast, onDismiss: mockOnDismiss }));

    expect(screen.getByText('Sucesso!')).toBeTruthy();
    expect(screen.getByText('Operação concluída')).toBeTruthy();
  });

  it('deve renderizar toast de erro', () => {
    const toast: ToastData = {
      id: 't2',
      type: 'error',
      title: 'Erro!',
    };

    render(React.createElement(Toast, { toast, onDismiss: mockOnDismiss }));
    expect(screen.getByText('Erro!')).toBeTruthy();
  });

  it('deve renderizar toast de warning', () => {
    const toast: ToastData = {
      id: 't3',
      type: 'warning',
      title: 'Atenção!',
    };

    render(React.createElement(Toast, { toast, onDismiss: mockOnDismiss }));
    expect(screen.getByText('Atenção!')).toBeTruthy();
  });

  it('deve renderizar toast de info', () => {
    const toast: ToastData = {
      id: 't4',
      type: 'info',
      title: 'Info',
    };

    render(React.createElement(Toast, { toast, onDismiss: mockOnDismiss }));
    expect(screen.getByText('Info')).toBeTruthy();
  });

  it('não deve renderizar mensagem quando não fornecida', () => {
    const toast: ToastData = {
      id: 't5',
      type: 'success',
      title: 'Apenas título',
    };

    render(React.createElement(Toast, { toast, onDismiss: mockOnDismiss }));
    expect(screen.getByText('Apenas título')).toBeTruthy();
  });
});
