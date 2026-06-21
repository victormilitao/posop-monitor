import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
import { WebView } from 'react-native-webview';
import { Button } from '../ui/Button';
import { AppColors } from '../../constants/colors';

export interface TermsScreenProps {
    role: 'doctor' | 'patient';
    onAccept: () => Promise<void>;
}

const TERMS_CONFIG = {
    doctor: {
        title: 'Termo de Consentimento',
        subtitle: 'Leia e aceite o TCLE para médicos antes de prosseguir.',
        pdfAsset: require('../../assets/documents/apendice-b-tcle-medico.pdf'),
        checkboxLabel: 'Li e concordo com o Termo de Consentimento Livre e Esclarecido (TCLE) para médicos.',
    },
    patient: {
        title: 'Termo de Consentimento',
        subtitle: 'Leia e aceite o TCLE antes de prosseguir.',
        pdfAsset: require('../../assets/documents/apendice-d-tcle-publico-alvo.pdf'),
        checkboxLabel: 'Li e concordo com o Termo de Consentimento Livre e Esclarecido (TCLE).',
    },
};

export function TermsScreen({ role, onAccept }: TermsScreenProps) {
    const [accepted, setAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pdfUri, setPdfUri] = useState<string | null>(null);
    const [isLoadingPdf, setIsLoadingPdf] = useState(true);
    const insets = useSafeAreaInsets();

    const config = TERMS_CONFIG[role];

    // Auto-load PDF when screen mounts
    useEffect(() => {
        const loadPdf = async () => {
            try {
                const asset = Asset.fromModule(config.pdfAsset);
                await asset.downloadAsync();

                if (asset.localUri) {
                    setPdfUri(asset.localUri);
                }
            } catch (error) {
                console.error('Error loading PDF:', error);
            } finally {
                setIsLoadingPdf(false);
            }
        };

        loadPdf();
    }, [config.pdfAsset]);

    const handleContinue = async () => {
        if (!accepted || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onAccept();
        } catch (error) {
            console.error('Error accepting terms:', error);
            setIsSubmitting(false);
        }
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View
                className="bg-primary-700 px-6 pb-4 rounded-b-3xl"
                style={{ paddingTop: insets.top + 12 }}
            >
                <Text className="text-xl font-bold text-white">{config.title}</Text>
                <Text className="text-primary-100 mt-1 text-sm">
                    {config.subtitle}
                </Text>
            </View>

            {/* PDF Viewer */}
            <View className="flex-1 mx-4 mt-4 mb-2 rounded-xl overflow-hidden bg-white" style={{
                borderWidth: 1,
                borderColor: AppColors.gray[200],
            }}>
                {isLoadingPdf ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={AppColors.primary[500]} />
                        <Text className="text-gray-500 mt-3">Carregando documento...</Text>
                    </View>
                ) : pdfUri ? (
                    <WebView
                        testID="pdf-webview"
                        source={{ uri: pdfUri }}
                        style={{ flex: 1, backgroundColor: AppColors.white }}
                        originWhitelist={['*']}
                        scalesPageToFit
                        startInLoadingState
                        renderLoading={() => (
                            <View className="flex-1 items-center justify-center" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: AppColors.white }}>
                                <ActivityIndicator size="large" color={AppColors.primary[500]} />
                            </View>
                        )}
                    />
                ) : (
                    <View className="flex-1 items-center justify-center p-6">
                        <Text className="text-gray-500 text-center">
                            Não foi possível carregar o documento. Tente novamente mais tarde.
                        </Text>
                    </View>
                )}
            </View>

            {/* Bottom Bar */}
            <View className="px-6 pb-6 pt-3 bg-white" style={{
                shadowColor: AppColors.black,
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 10,
                borderTopWidth: 1,
                borderTopColor: AppColors.gray[100],
            }}>
                <TouchableOpacity
                    testID="terms-checkbox"
                    className="flex-row items-center mb-4"
                    onPress={() => setAccepted(!accepted)}
                    activeOpacity={0.7}
                >
                    <View
                        className="w-6 h-6 rounded border items-center justify-center mr-3"
                        style={{
                            backgroundColor: accepted ? AppColors.primary[600] : AppColors.white,
                            borderColor: accepted ? AppColors.primary[600] : AppColors.gray[400],
                        }}
                    >
                        {accepted && <Check size={16} color={AppColors.white} />}
                    </View>
                    <Text className="flex-1 text-sm text-gray-700" style={{ fontWeight: '600' }}>
                        {config.checkboxLabel}
                    </Text>
                </TouchableOpacity>

                <Button
                    testID="terms-continue-button"
                    title="Continuar"
                    onPress={handleContinue}
                    disabled={!accepted}
                    isLoading={isSubmitting}
                />
            </View>
        </View>
    );
}
