import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { Button } from '../../components/ui/Button';
import { AppColors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

export default function PatientTermsScreen() {
    const [accepted, setAccepted] = useState(false);
    const router = useRouter();
    const { profile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleContinue = async () => {
        if (!accepted || !profile?.id) return;
        setIsSubmitting(true);
        try {
            await SecureStore.setItemAsync(`terms_accepted_${profile.id}`, 'true');
            router.replace('/patient/dashboard');
        } catch (error) {
            console.error('Error saving terms acceptance:', error);
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: AppColors.primary[900] }}>
            <View className="flex-1 px-6 pt-8">
                <Text className="text-2xl font-bold text-white mb-6">Termos de Uso e Política de Privacidade</Text>
                
                <ScrollView 
                    className="flex-1 bg-white/10 rounded-xl p-4 border border-white/20 mb-6"
                    showsVerticalScrollIndicator={false}
                >
                    <Text className="text-white text-base leading-relaxed">
                        Bem-vindo(a) ao PosOp Monitor.
                        {'\n\n'}
                        Ao utilizar nosso aplicativo, você concorda com a coleta e o processamento dos seus dados de saúde para fins de acompanhamento pós-operatório. Seus dados serão compartilhados exclusivamente com o seu médico responsável.
                        {'\n\n'}
                        1. Uso das Informações{'\n'}
                        Suas informações serão utilizadas para monitorar sua recuperação e alertar seu médico sobre possíveis sinais de risco.
                        {'\n\n'}
                        2. Privacidade e Segurança{'\n'}
                        Empregamos medidas de segurança para proteger seus dados, conforme exigido pelas leis de proteção de dados vigentes.
                        {'\n\n'}
                        [O TEXTO COMPLETO SERÁ INSERIDO AQUI POSTERIORMENTE]
                    </Text>
                </ScrollView>
            </View>

            <View className="px-6 pb-8 pt-4" style={{
                backgroundColor: AppColors.primary[900],
                borderTopWidth: 1,
                borderTopColor: 'rgba(255,255,255,0.1)'
            }}>
                <TouchableOpacity 
                    className="flex-row items-center mb-6" 
                    onPress={() => setAccepted(!accepted)}
                    activeOpacity={0.7}
                >
                    <View 
                        className={`w-6 h-6 rounded-md border items-center justify-center mr-3 ${accepted ? 'bg-purple-500 border-purple-500' : 'bg-transparent border-white/50'}`}
                    >
                        {accepted && <Check size={16} color="#ffffff" />}
                    </View>
                    <Text className="flex-1 text-sm text-gray-300 uppercase" style={{ fontWeight: '600', letterSpacing: 0.5 }}>
                        Li e concordo com os <Text className="text-purple-400 underline" style={{ textDecorationLine: 'underline' }}>Termos de Uso</Text> e <Text className="text-purple-400 underline" style={{ textDecorationLine: 'underline' }}>Política de Privacidade</Text>.
                    </Text>
                </TouchableOpacity>

                <Button 
                    title="Continuar" 
                    onPress={handleContinue} 
                    disabled={!accepted} 
                    isLoading={isSubmitting}
                    variant="light"
                />
            </View>
        </SafeAreaView>
    );
}
