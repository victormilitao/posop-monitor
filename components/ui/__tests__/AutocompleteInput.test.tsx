import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { AutocompleteInput } from '../AutocompleteInput';

describe('AutocompleteInput', () => {
  const suggestions = [
    'Hospital São Lucas',
    'Hospital Albert Einstein',
    'Clínica Santa Clara',
    'Hospital Sírio-Libanês',
  ];

  const defaultProps = {
    value: '',
    onChangeText: jest.fn(),
    suggestions,
    testID: 'hospital-input',
    placeholder: 'Nome do hospital',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve renderizar o input corretamente', () => {
    const { getByTestId } = render(<AutocompleteInput {...defaultProps} />);
    expect(getByTestId('hospital-input')).toBeTruthy();
  });

  it('não deve mostrar sugestões quando o campo está vazio', () => {
    const { queryByTestId } = render(<AutocompleteInput {...defaultProps} />);
    expect(queryByTestId('hospital-input-suggestions')).toBeNull();
  });

  it('deve mostrar sugestões filtradas ao digitar', () => {
    const { getByTestId, queryByTestId } = render(
      <AutocompleteInput {...defaultProps} value="São" />
    );

    // Focus the input to trigger suggestions
    fireEvent(getByTestId('hospital-input'), 'focus');

    expect(queryByTestId('hospital-input-suggestions')).toBeTruthy();
    expect(queryByTestId('hospital-input-suggestion-0')).toBeTruthy();
  });

  it('deve chamar onChangeText ao digitar', () => {
    const { getByTestId } = render(<AutocompleteInput {...defaultProps} />);
    fireEvent.changeText(getByTestId('hospital-input'), 'Hospital');
    expect(defaultProps.onChangeText).toHaveBeenCalledWith('Hospital');
  });

  it('deve preencher o input ao selecionar uma sugestão', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <AutocompleteInput
        {...defaultProps}
        value="São"
        onChangeText={onChangeText}
      />
    );

    // Focus the input to show suggestions
    fireEvent(getByTestId('hospital-input'), 'focus');

    // Select the first suggestion
    fireEvent.press(getByTestId('hospital-input-suggestion-0'));
    expect(onChangeText).toHaveBeenCalledWith('Hospital São Lucas');
  });

  it('não deve mostrar sugestões quando o valor corresponde exatamente', () => {
    const { getByTestId, queryByTestId } = render(
      <AutocompleteInput {...defaultProps} value="Hospital São Lucas" />
    );

    fireEvent(getByTestId('hospital-input'), 'focus');

    // Should not show because the value matches exactly
    expect(queryByTestId('hospital-input-suggestions')).toBeNull();
  });

  it('não deve mostrar sugestões quando desabilitado', () => {
    const { getByTestId, queryByTestId } = render(
      <AutocompleteInput {...defaultProps} value="São" disabled />
    );

    fireEvent(getByTestId('hospital-input'), 'focus');
    expect(queryByTestId('hospital-input-suggestions')).toBeNull();
  });

  it('deve esconder sugestões ao perder foco', () => {
    const { getByTestId, queryByTestId } = render(
      <AutocompleteInput {...defaultProps} value="São" />
    );

    fireEvent(getByTestId('hospital-input'), 'focus');
    expect(queryByTestId('hospital-input-suggestions')).toBeTruthy();

    fireEvent(getByTestId('hospital-input'), 'blur');

    // Advance the timer for the blur delay
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(queryByTestId('hospital-input-suggestions')).toBeNull();
  });

  it('deve limitar o número máximo de sugestões', () => {
    const manySuggestions = [
      'Hospital A',
      'Hospital B',
      'Hospital C',
      'Hospital D',
      'Hospital E',
      'Hospital F',
      'Hospital G',
    ];

    const { getByTestId, queryByTestId } = render(
      <AutocompleteInput
        {...defaultProps}
        value="Hospital"
        suggestions={manySuggestions}
        maxSuggestions={3}
      />
    );

    fireEvent(getByTestId('hospital-input'), 'focus');

    expect(queryByTestId('hospital-input-suggestion-0')).toBeTruthy();
    expect(queryByTestId('hospital-input-suggestion-1')).toBeTruthy();
    expect(queryByTestId('hospital-input-suggestion-2')).toBeTruthy();
    expect(queryByTestId('hospital-input-suggestion-3')).toBeNull();
  });

  it('não deve mostrar sugestões quando não há correspondências', () => {
    const { getByTestId, queryByTestId } = render(
      <AutocompleteInput {...defaultProps} value="XYZ123" />
    );

    fireEvent(getByTestId('hospital-input'), 'focus');
    expect(queryByTestId('hospital-input-suggestions')).toBeNull();
  });

  it('deve filtrar sugestões case-insensitive', () => {
    const { getByTestId, queryByTestId } = render(
      <AutocompleteInput {...defaultProps} value="são" />
    );

    fireEvent(getByTestId('hospital-input'), 'focus');
    expect(queryByTestId('hospital-input-suggestions')).toBeTruthy();
  });
});
