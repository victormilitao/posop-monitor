import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { render, fireEvent, screen, act } from '@testing-library/react-native';
import { ToastProvider, useToast } from '../ToastContext';

function TestConsumer() {
  const { showToast } = useToast();

  return React.createElement(
    View,
    null,
    React.createElement(
      TouchableOpacity,
      {
        testID: 'show-success-btn',
        onPress: () =>
          showToast({ type: 'success', title: 'Sucesso!', message: 'Operação concluída' }),
      },
      React.createElement(Text, null, 'Mostrar Success'),
    ),
    React.createElement(
      TouchableOpacity,
      {
        testID: 'show-error-btn',
        onPress: () =>
          showToast({ type: 'error', title: 'Erro!', message: 'Algo deu errado' }),
      },
      React.createElement(Text, null, 'Mostrar Error'),
    ),
    React.createElement(
      TouchableOpacity,
      {
        testID: 'show-info-btn',
        onPress: () =>
          showToast({ type: 'info', title: 'Info', message: 'Informação' }),
      },
      React.createElement(Text, null, 'Mostrar Info'),
    ),
  );
}

describe('ToastContext', () => {
  it('deve fornecer showToast via context', () => {
    render(
      React.createElement(ToastProvider, null, React.createElement(TestConsumer)),
    );

    expect(screen.getByTestId('show-success-btn')).toBeTruthy();
  });

  it('deve exibir toast de sucesso quando showToast é chamado', () => {
    render(
      React.createElement(ToastProvider, null, React.createElement(TestConsumer)),
    );

    fireEvent.press(screen.getByTestId('show-success-btn'));

    expect(screen.getByText('Sucesso!')).toBeTruthy();
  });

  it('deve exibir toast de erro', () => {
    render(
      React.createElement(ToastProvider, null, React.createElement(TestConsumer)),
    );

    fireEvent.press(screen.getByTestId('show-error-btn'));
    expect(screen.getByText('Erro!')).toBeTruthy();
  });

  it('deve exibir múltiplos toasts', () => {
    render(
      React.createElement(ToastProvider, null, React.createElement(TestConsumer)),
    );

    fireEvent.press(screen.getByTestId('show-success-btn'));
    fireEvent.press(screen.getByTestId('show-error-btn'));

    expect(screen.getByText('Sucesso!')).toBeTruthy();
    expect(screen.getByText('Erro!')).toBeTruthy();
  });
});
