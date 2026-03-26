import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ActionMenuItem } from '../ActionMenuItem';

// Simple mock icon component
const MockIcon = (props: any) => {
  const { View } = require('react-native');
  return React.createElement(View, { testID: 'mock-icon', ...props });
};

describe('ActionMenuItem', () => {
  const baseProps = {
    title: 'Relatório Diário',
    subtitle: 'Responda suas perguntas',
    icon: MockIcon,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar título e subtítulo', () => {
    render(React.createElement(ActionMenuItem, baseProps));
    expect(screen.getByText('Relatório Diário')).toBeTruthy();
    expect(screen.getByText('Responda suas perguntas')).toBeTruthy();
  });

  it('deve chamar onPress ao tocar', () => {
    render(React.createElement(ActionMenuItem, baseProps));
    fireEvent.press(screen.getByText('Relatório Diário'));
    expect(baseProps.onPress).toHaveBeenCalled();
  });

  it('deve renderizar actionLabel quando fornecido', () => {
    render(
      React.createElement(ActionMenuItem, { ...baseProps, actionLabel: 'Pendente' }),
    );
    expect(screen.getByText('Pendente')).toBeTruthy();
  });

  it('deve renderizar ícone', () => {
    render(React.createElement(ActionMenuItem, baseProps));
    expect(screen.getByTestId('mock-icon')).toBeTruthy();
  });
});
