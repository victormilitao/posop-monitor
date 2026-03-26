import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('deve renderizar label', () => {
    render(React.createElement(Badge, { label: 'Dia 5' }));
    expect(screen.getByText('Dia 5')).toBeTruthy();
  });

  it('deve renderizar com variant default', () => {
    render(React.createElement(Badge, { label: 'Status' }));
    expect(screen.getByText('Status')).toBeTruthy();
  });

  it('deve renderizar com variant critical', () => {
    render(React.createElement(Badge, { label: 'Crítico', variant: 'critical' }));
    expect(screen.getByText('Crítico')).toBeTruthy();
  });

  it('deve renderizar com variant warning', () => {
    render(React.createElement(Badge, { label: 'Atenção', variant: 'warning' }));
    expect(screen.getByText('Atenção')).toBeTruthy();
  });

  it('deve renderizar com variant success', () => {
    render(React.createElement(Badge, { label: 'Estável', variant: 'success' }));
    expect(screen.getByText('Estável')).toBeTruthy();
  });
});
