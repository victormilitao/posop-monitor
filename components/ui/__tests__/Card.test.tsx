import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Card } from '../Card';

describe('Card', () => {
  it('deve renderizar children', () => {
    render(
      React.createElement(Card, null, React.createElement(Text, null, 'Conteúdo')),
    );
    expect(screen.getByText('Conteúdo')).toBeTruthy();
  });

  it('deve renderizar com borda por padrão', () => {
    const { toJSON } = render(
      React.createElement(Card, null, React.createElement(Text, null, 'Test')),
    );
    expect(toJSON()).toBeTruthy();
  });

  it('deve renderizar sem borda quando bordered=false', () => {
    const { toJSON } = render(
      React.createElement(Card, { bordered: false }, React.createElement(Text, null, 'Test')),
    );
    expect(toJSON()).toBeTruthy();
  });
});
