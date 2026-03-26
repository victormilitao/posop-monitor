import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { StatsGrid } from '../StatsGrid';

describe('StatsGrid', () => {
  const defaultCounts = { critical: 2, warning: 3, stable: 10, finished: 5 };

  it('deve renderizar todas as contagens', () => {
    render(React.createElement(StatsGrid, { counts: defaultCounts }));
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('deve renderizar labels', () => {
    render(React.createElement(StatsGrid, { counts: defaultCounts }));
    expect(screen.getByText('Crítico')).toBeTruthy();
    expect(screen.getByText('Atenção')).toBeTruthy();
    expect(screen.getByText('Esperado')).toBeTruthy();
    expect(screen.getByText('Finalizados')).toBeTruthy();
  });

  it('deve chamar onSelectStatus ao tocar em Crítico', () => {
    const onSelect = jest.fn();
    render(
      React.createElement(StatsGrid, {
        counts: defaultCounts,
        onSelectStatus: onSelect,
      }),
    );

    fireEvent.press(screen.getByText('Crítico'));
    expect(onSelect).toHaveBeenCalledWith('critical');
  });

  it('deve chamar onSelectStatus ao tocar em Atenção', () => {
    const onSelect = jest.fn();
    render(
      React.createElement(StatsGrid, {
        counts: defaultCounts,
        onSelectStatus: onSelect,
      }),
    );

    fireEvent.press(screen.getByText('Atenção'));
    expect(onSelect).toHaveBeenCalledWith('warning');
  });

  it('deve chamar onSelectStatus ao tocar em Esperado', () => {
    const onSelect = jest.fn();
    render(
      React.createElement(StatsGrid, {
        counts: defaultCounts,
        onSelectStatus: onSelect,
      }),
    );

    fireEvent.press(screen.getByText('Esperado'));
    expect(onSelect).toHaveBeenCalledWith('stable');
  });

  it('deve chamar onSelectStatus ao tocar em Finalizados', () => {
    const onSelect = jest.fn();
    render(
      React.createElement(StatsGrid, {
        counts: defaultCounts,
        onSelectStatus: onSelect,
      }),
    );

    fireEvent.press(screen.getByText('Finalizados'));
    expect(onSelect).toHaveBeenCalledWith('finished');
  });

  it('deve renderizar com contagens padrão quando sem counts', () => {
    render(React.createElement(StatsGrid, {}));
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(4);
  });

  it('deve chamar onSelectStatus ao tocar no card selecionado', () => {
    const onSelect = jest.fn();
    render(
      React.createElement(StatsGrid, {
        counts: defaultCounts,
        onSelectStatus: onSelect,
        selectedStatus: 'critical',
      }),
    );

    fireEvent.press(screen.getByText('Crítico'));
    expect(onSelect).toHaveBeenCalledWith('critical');
  });
});
