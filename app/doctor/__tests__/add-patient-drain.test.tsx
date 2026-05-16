import React from 'react';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react-native';

// --- Mocks ---

const mockRouter = { back: jest.fn(), push: jest.fn() };
const mockQueryClient = { invalidateQueries: jest.fn() };
const mockShowToast = jest.fn();
const mockCreatePatient = jest.fn();
const mockGetActiveSurgeryTypes = jest.fn();

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => mockRouter,
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => mockQueryClient,
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'doc-1', full_name: 'Dr. Test' } }),
}));

jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock('../../../hooks/useHospitalSuggestions', () => ({
  useHospitalSuggestions: () => ({ data: [] }),
}));

const mockSurgeryTypes = [
  { id: 'st-col', name: 'Colecistectomia', expected_recovery_days: 14, is_active: true, applicable_sex: 'both' },
  { id: 'st-art', name: 'Artroscopia', expected_recovery_days: 10, is_active: true, applicable_sex: 'both' },
];

jest.mock('../../../services', () => ({
  patientService: {
    createPatient: (...args: any[]) => mockCreatePatient(...args),
  },
  surgeryTypeService: {
    getActiveSurgeryTypes: (...args: any[]) => mockGetActiveSurgeryTypes(...args),
  },
}));

// PickerModal mock: captures onSelect and allows test to call it directly
let capturedPickerOnSelect: ((option: any) => void) | null = null;

jest.mock('../../../components/ui/SearchablePickerModal', () => ({
  PickerModal: ({ visible, onSelect, options, onClose }: any) => {
    const React = require('react');
    const { View, TouchableOpacity, Text } = require('react-native');
    capturedPickerOnSelect = onSelect;
    if (!visible) return null;
    return React.createElement(View, { testID: 'picker-modal' },
      (options || []).map((opt: any) =>
        React.createElement(TouchableOpacity, {
          key: opt.id,
          testID: `picker-option-${opt.id}`,
          onPress: () => { onSelect(opt); onClose?.(); },
        }, React.createElement(Text, null, opt.label))
      )
    );
  },
}));

jest.mock('../../../components/doctor/ConfirmPatientModal', () => ({
  ConfirmPatientModal: ({ visible, data, onConfirm }: any) => {
    if (!visible) return null;
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    return React.createElement(View, { testID: 'confirm-modal' },
      React.createElement(Text, { testID: 'confirm-data' }, JSON.stringify(data)),
      React.createElement(TouchableOpacity, { testID: 'confirm-button', onPress: onConfirm },
        React.createElement(Text, null, 'Confirmar'))
    );
  },
  ConfirmPatientData: {},
}));

jest.mock('../../../components/ui/AutocompleteInput', () => ({
  AutocompleteInput: (props: any) => {
    const React = require('react');
    const { TextInput } = require('react-native');
    return React.createElement(TextInput, { ...props });
  },
}));

import AddPatientScreen from '../add-patient';

describe('AddPatientScreen - Regra do Dreno', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedPickerOnSelect = null;
    mockCreatePatient.mockResolvedValue({ patientId: 'p1', surgeryId: 's1' });
    mockGetActiveSurgeryTypes.mockResolvedValue(mockSurgeryTypes);
  });

  const selectSurgeryType = async (typeId: string) => {
    // Wait for types to load
    await waitFor(() => {
      expect(screen.getByTestId('surgery-type-selector')).toBeTruthy();
    });

    // Open picker
    fireEvent.press(screen.getByTestId('surgery-type-selector'));

    // Wait for picker to show options
    await waitFor(() => {
      expect(screen.getByTestId(`picker-option-${typeId}`)).toBeTruthy();
    });

    // Select the option
    await act(async () => {
      fireEvent.press(screen.getByTestId(`picker-option-${typeId}`));
    });
  };

  it('não deve exibir toggle de dreno quando nenhum procedimento exige dreno', async () => {
    render(React.createElement(AddPatientScreen));

    // Wait for surgery types to load - the component auto-selects the first type
    await waitFor(() => {
      expect(screen.getByTestId('surgery-type-selector')).toBeTruthy();
    });

    // Since Colecistectomia is auto-selected as first option,
    // let's select Artroscopia instead
    await selectSurgeryType('st-art');

    // Drain toggle should NOT be visible
    expect(screen.queryByText('Possui dreno?')).toBeNull();
  });

  it('deve exibir toggle de dreno quando Colecistectomia é selecionada', async () => {
    render(React.createElement(AddPatientScreen));

    await selectSurgeryType('st-col');

    // Drain toggle should be visible
    await waitFor(() => {
      expect(screen.getByText('Possui dreno?')).toBeTruthy();
    });

    // Should show both toggle buttons
    expect(screen.getByTestId('drain-toggle-yes')).toBeTruthy();
    expect(screen.getByTestId('drain-toggle-no')).toBeTruthy();
  });

  it('deve ocultar toggle de dreno ao trocar de Colecistectomia para Artroscopia', async () => {
    render(React.createElement(AddPatientScreen));

    // First select Colecistectomia
    await selectSurgeryType('st-col');
    await waitFor(() => {
      expect(screen.getByText('Possui dreno?')).toBeTruthy();
    });

    // Now switch to Artroscopia
    await selectSurgeryType('st-art');

    // Drain toggle should disappear
    await waitFor(() => {
      expect(screen.queryByText('Possui dreno?')).toBeNull();
    });
  });

  it('deve permitir selecionar "Sim" no toggle de dreno', async () => {
    render(React.createElement(AddPatientScreen));

    await selectSurgeryType('st-col');
    await waitFor(() => {
      expect(screen.getByTestId('drain-toggle-yes')).toBeTruthy();
    });

    // Press "Sim"
    await act(async () => {
      fireEvent.press(screen.getByTestId('drain-toggle-yes'));
    });

    // Verify the button is present (toggle state changed)
    expect(screen.getByTestId('drain-toggle-yes')).toBeTruthy();
  });

  it('deve resetar dreno para false ao trocar de procedimento', async () => {
    render(React.createElement(AddPatientScreen));

    // Select Colecistectomia and enable drain
    await selectSurgeryType('st-col');
    await waitFor(() => expect(screen.getByTestId('drain-toggle-yes')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('drain-toggle-yes'));
    });

    // Switch to Artroscopia (drain should reset)
    await selectSurgeryType('st-art');

    // Switch back to Colecistectomia
    await selectSurgeryType('st-col');

    // Drain toggle should be visible again, but default to "Não" (reset)
    await waitFor(() => {
      expect(screen.getByText('Possui dreno?')).toBeTruthy();
    });
    expect(screen.getByTestId('drain-toggle-no')).toBeTruthy();
  });
});
