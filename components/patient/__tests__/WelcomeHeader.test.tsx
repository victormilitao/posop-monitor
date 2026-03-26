import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { WelcomeHeader } from '../WelcomeHeader';

describe('WelcomeHeader', () => {
  it('deve renderizar tipo de cirurgia', () => {
    render(React.createElement(WelcomeHeader, { surgeryType: 'Artroscopia', surgeryDate: '20/03/2026' }));
    expect(screen.getByText('Artroscopia')).toBeTruthy();
  });

  it('deve renderizar data da cirurgia', () => {
    render(React.createElement(WelcomeHeader, { surgeryType: 'Artroscopia', surgeryDate: '20/03/2026' }));
    expect(screen.getByText('20/03/2026')).toBeTruthy();
  });

  it('deve renderizar labels', () => {
    render(React.createElement(WelcomeHeader, { surgeryType: 'Test', surgeryDate: '01/01/2026' }));
    expect(screen.getByText('Cirurgia:')).toBeTruthy();
    expect(screen.getByText('Data:')).toBeTruthy();
  });
});
