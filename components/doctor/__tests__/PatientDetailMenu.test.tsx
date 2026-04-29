import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { PatientDetailMenuItem } from '../PatientDetailMenu';
import { User } from 'lucide-react-native';

describe('PatientDetailMenuItem', () => {
  const baseProps = {
    title: 'Perfil do Paciente',
    subtitle: 'Visualize e edite os dados cadastrais',
    icon: User,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar título e subtítulo', () => {
    render(React.createElement(PatientDetailMenuItem, baseProps));
    expect(screen.getByText('Perfil do Paciente')).toBeTruthy();
    expect(screen.getByText('Visualize e edite os dados cadastrais')).toBeTruthy();
  });

  it('deve chamar onPress ao ser pressionado', () => {
    render(React.createElement(PatientDetailMenuItem, baseProps));
    fireEvent.press(screen.getByText('Perfil do Paciente'));
    expect(baseProps.onPress).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar ícone de chevron', () => {
    render(React.createElement(PatientDetailMenuItem, baseProps));
    expect(screen.getByTestId('icon-ChevronRight')).toBeTruthy();
  });

  it('deve aceitar testID personalizado', () => {
    render(React.createElement(PatientDetailMenuItem, { ...baseProps, testID: 'menu-profile' }));
    expect(screen.getByTestId('menu-profile')).toBeTruthy();
  });

  it('deve renderizar ícone do componente', () => {
    render(React.createElement(PatientDetailMenuItem, baseProps));
    expect(screen.getByTestId('icon-User')).toBeTruthy();
  });
});
