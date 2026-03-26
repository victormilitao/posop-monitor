import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('deve renderizar título', () => {
    render(React.createElement(Button, { title: 'Salvar' }));
    expect(screen.getByText('Salvar')).toBeTruthy();
  });

  it('deve chamar onPress ao tocar', () => {
    const onPress = jest.fn();
    render(React.createElement(Button, { title: 'Salvar', onPress }));
    fireEvent.press(screen.getByText('Salvar'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar subtítulo quando fornecido', () => {
    render(React.createElement(Button, { title: 'Ação', subtitle: 'Detalhes' }));
    expect(screen.getByText('Detalhes')).toBeTruthy();
  });

  it('deve exibir loading indicator quando isLoading', () => {
    render(React.createElement(Button, { title: 'Salvar', isLoading: true }));
    // O texto não deve aparecer quando loading
    expect(screen.queryByText('Salvar')).toBeNull();
  });

  it('deve estar desabilitado quando disabled', () => {
    const onPress = jest.fn();
    render(React.createElement(Button, { title: 'Salvar', onPress, disabled: true }));
    fireEvent.press(screen.getByText('Salvar'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('deve renderizar ícone quando fornecido', () => {
    const { Text } = require('react-native');
    const icon = React.createElement(Text, { testID: 'icon' }, 'X');
    render(React.createElement(Button, { title: 'Salvar', icon }));
    expect(screen.getByTestId('icon')).toBeTruthy();
  });

  it('deve aplicar variant outline', () => {
    render(React.createElement(Button, { title: 'Salvar', variant: 'outline' }));
    expect(screen.getByText('Salvar')).toBeTruthy();
  });

  it('deve aplicar variant ghost', () => {
    render(React.createElement(Button, { title: 'Salvar', variant: 'ghost' }));
    expect(screen.getByText('Salvar')).toBeTruthy();
  });

  it('deve aplicar variant danger', () => {
    render(React.createElement(Button, { title: 'Deletar', variant: 'danger' }));
    expect(screen.getByText('Deletar')).toBeTruthy();
  });

  it('deve aplicar variant light', () => {
    render(React.createElement(Button, { title: 'Salvar', variant: 'light' }));
    expect(screen.getByText('Salvar')).toBeTruthy();
  });
});
