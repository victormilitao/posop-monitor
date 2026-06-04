import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Check } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { AppColors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function PatientTermsScreen() {
    const [accepted, setAccepted] = useState(false);
    const router = useRouter();
    const { profile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const insets = useSafeAreaInsets();

    const handleContinue = async () => {
        if (!accepted || !profile?.id) return;
        setIsSubmitting(true);
        try {
            await SecureStore.setItemAsync(`terms_accepted_${profile.id}`, 'true');
            
            await supabase.auth.updateUser({
                data: { terms_accepted: true }
            });

            router.replace('/patient/dashboard');
        } catch (error) {
            console.error('Error saving terms acceptance:', error);
            setIsSubmitting(false);
        }
    };

    return (
        <View className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* Header */}
            <View
                className="bg-primary-700 px-6 pb-6 rounded-b-3xl"
                style={{ paddingTop: insets.top + 16 }}
            >
                <Text className="text-2xl font-bold text-white">Termos e Privacidade</Text>
                <Text className="text-primary-100 mt-2">
                    Precisamos que você leia e aceite os termos antes de prosseguir
                </Text>
            </View>

            {/* Body */}
            <ScrollView 
                className="flex-1 px-6 pt-6"
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="bg-white rounded-xl p-5 border border-gray-200">
                    <Text className="text-gray-800 text-base leading-relaxed">
                        Bem-vindo(a) ao PosOp Monitor.
                        {'\n\n'}
                        Ao utilizar nosso aplicativo, você concorda com a coleta e o processamento dos seus dados de saúde para fins de acompanhamento pós-operatório. Seus dados serão compartilhados exclusivamente com o seu médico responsável.
                        {'\n\n'}
                        <Text className="font-bold">1. Uso das Informações</Text>{'\n'}
                        Suas informações serão utilizadas para monitorar sua recuperação e alertar seu médico sobre possíveis sinais de risco.
                        {'\n\n'}
                        <Text className="font-bold">2. Privacidade e Segurança</Text>{'\n'}
                        Empregamos medidas de segurança para proteger seus dados, conforme exigido pelas leis de proteção de dados vigentes.
                        {'\n\n'}
                        [O TEXTO COMPLETO SERÁ INSERIDO AQUI POSTERIORMENTE]
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Bar */}
            <View className="px-6 pb-8 pt-4 bg-white" style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 10,
                borderTopWidth: 1,
                borderTopColor: '#f3f4f6'
            }}>
                <TouchableOpacity 
                    className="flex-row items-center mb-6" 
                    onPress={() => setAccepted(!accepted)}
                    activeOpacity={0.7}
                >
                    <View 
                        className={`w-6 h-6 rounded border items-center justify-center mr-3 ${accepted ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-400'}`}
                    >
                        {accepted && <Check size={16} color="#ffffff" />}
                    </View>
                    <Text className="flex-1 text-sm text-gray-700 uppercase" style={{ fontWeight: '600' }}>
                        Li e concordo com os <Text className="text-primary-600 underline">Termos de Uso</Text> e <Text className="text-primary-600 underline">Política de Privacidade</Text>.
                    </Text>
                </TouchableOpacity>

                <Button 
                    title="Continuar" 
                    onPress={handleContinue} 
                    disabled={!accepted} 
                    isLoading={isSubmitting}
                />
            </View>
        </View>
    );
}
