import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Asset } from 'expo-asset';
import { TermsScreen, TermsScreenProps } from '../TermsScreen';

// Mock expo-router
jest.mock('expo-router', () => ({
    useRouter: jest.fn(() => ({ replace: jest.fn() })),
    Stack: { Screen: () => null },
}));

// Mock the PDF assets
jest.mock('../../../assets/documents/apendice-b-tcle-medico.pdf', () => 1, { virtual: true });
jest.mock('../../../assets/documents/apendice-d-tcle-publico-alvo.pdf', () => 2, { virtual: true });

// Mock react-native-webview
jest.mock('react-native-webview', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        WebView: (props: any) => React.createElement(View, { ...props, testID: props.testID || 'pdf-webview' }),
    };
});

describe('TermsScreen', () => {
    const mockOnAccept = jest.fn(() => Promise.resolve());

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderComponent = (props: Partial<TermsScreenProps> = {}) => {
        return render(
            <TermsScreen
                role="patient"
                onAccept={mockOnAccept}
                {...props}
            />
        );
    };

    describe('Renderização', () => {
        it('deve renderizar título correto para paciente', async () => {
            const { getByText } = renderComponent({ role: 'patient' });

            expect(getByText('Termo de Consentimento')).toBeTruthy();
            expect(getByText(/Leia e aceite o TCLE antes de prosseguir\./)).toBeTruthy();
        });

        it('deve renderizar título correto para médico', async () => {
            const { getByText } = renderComponent({ role: 'doctor' });

            expect(getByText('Termo de Consentimento')).toBeTruthy();
            expect(getByText(/Leia e aceite o TCLE para médicos antes de prosseguir\./)).toBeTruthy();
        });

        it('deve renderizar checkbox label correto para paciente', () => {
            const { getByText } = renderComponent({ role: 'patient' });

            expect(getByText(/Li e concordo com o Termo de Consentimento Livre e Esclarecido \(TCLE\)\./)).toBeTruthy();
        });

        it('deve renderizar checkbox label correto para médico', () => {
            const { getByText } = renderComponent({ role: 'doctor' });

            expect(getByText(/Li e concordo com o Termo de Consentimento Livre e Esclarecido \(TCLE\) para médicos\./)).toBeTruthy();
        });

        it('deve renderizar botão continuar desabilitado inicialmente', () => {
            const { getByTestId } = renderComponent();

            const continueButton = getByTestId('terms-continue-button');
            expect(continueButton.props.accessibilityState?.disabled || continueButton.props.disabled).toBeTruthy();
        });

        it('deve carregar o PDF automaticamente via Asset', async () => {
            renderComponent();

            await waitFor(() => {
                expect(Asset.fromModule).toHaveBeenCalled();
            });
        });

        it('deve exibir WebView com PDF quando carregado', async () => {
            const { getByTestId } = renderComponent();

            await waitFor(() => {
                expect(getByTestId('pdf-webview')).toBeTruthy();
            });
        });

        it('deve exibir mensagem de erro quando PDF falha ao carregar', async () => {
            (Asset.fromModule as jest.Mock).mockReturnValueOnce({
                downloadAsync: jest.fn().mockRejectedValue(new Error('fail')),
                localUri: null,
            });

            const { getByText } = renderComponent();

            await waitFor(() => {
                expect(getByText(/Não foi possível carregar o documento/)).toBeTruthy();
            });
        });
    });

    describe('Checkbox', () => {
        it('deve habilitar botão continuar ao marcar checkbox', () => {
            const { getByTestId } = renderComponent();

            fireEvent.press(getByTestId('terms-checkbox'));

            const continueButton = getByTestId('terms-continue-button');
            expect(continueButton.props.accessibilityState?.disabled).toBeFalsy();
        });

        it('deve desabilitar botão ao desmarcar checkbox', () => {
            const { getByTestId } = renderComponent();

            fireEvent.press(getByTestId('terms-checkbox'));
            fireEvent.press(getByTestId('terms-checkbox'));

            const continueButton = getByTestId('terms-continue-button');
            expect(continueButton.props.accessibilityState?.disabled || continueButton.props.disabled).toBeTruthy();
        });
    });

    describe('Aceitar termos', () => {
        it('deve chamar onAccept ao clicar continuar com checkbox marcado', async () => {
            const { getByTestId } = renderComponent();

            fireEvent.press(getByTestId('terms-checkbox'));
            fireEvent.press(getByTestId('terms-continue-button'));

            await waitFor(() => {
                expect(mockOnAccept).toHaveBeenCalledTimes(1);
            });
        });

        it('não deve chamar onAccept quando checkbox não marcado', () => {
            const { getByTestId } = renderComponent();

            fireEvent.press(getByTestId('terms-continue-button'));

            expect(mockOnAccept).not.toHaveBeenCalled();
        });

        it('não deve chamar onAccept duas vezes durante submissão', async () => {
            const slowAccept = jest.fn(() => new Promise<void>(resolve => setTimeout(resolve, 1000)));
            const { getByTestId } = renderComponent({ onAccept: slowAccept });

            fireEvent.press(getByTestId('terms-checkbox'));
            fireEvent.press(getByTestId('terms-continue-button'));
            fireEvent.press(getByTestId('terms-continue-button'));

            await waitFor(() => {
                expect(slowAccept).toHaveBeenCalledTimes(1);
            });
        });
    });
});
