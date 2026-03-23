import { LinearGradient } from 'expo-linear-gradient';
import { Href, Stack, useRouter } from 'expo-router';
import { FileText, Lock, Stethoscope, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { AppColors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';



export default function LoginScreen() {
  const router = useRouter();
  const { session, profile, isLoading: isAuthLoading } = useAuth();
  const [role, setRole] = useState<'none' | 'patient' | 'doctor'>('none');

  // Form states
  const [patientPhone, setPatientPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');

  // Doctor Registration Form states
  const [isRegisteringDoctor, setIsRegisteringDoctor] = useState(false);
  const [docName, setDocName] = useState('');
  const [docCpf, setDocCpf] = useState('');
  const [docCrm, setDocCrm] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docPhoneBusiness, setDocPhoneBusiness] = useState('');
  const [docPhonePersonal, setDocPhonePersonal] = useState('');
  const [docPassword, setDocPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  // Auto-redirect if logged in
  useEffect(() => {
    if (!isAuthLoading && session && profile) {
      if (profile.role === 'doctor') {
        router.replace('/doctor/dashboard' as Href);
      } else {
        router.replace('/patient/dashboard');
      }
    }
  }, [session, profile, isAuthLoading]);

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handlePatientLogin = async () => {
    const cleanPhone: string = patientPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('Atenção', 'Número de telefone inválido.');
      return;
    }
    setIsLoading(true);
    try {
      // Find email by phone
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('phone', cleanPhone)
        .single();

      if (profileError || !profileData?.email) {
        Alert.alert('Não encontrado', 'Não encontramos um cadastro com esse número de telefone. Verifique se o número foi digitado corretamente.');
        setIsLoading(false);
        return;
      }

      // Sign in with the email associated with the phone
      const { error: devLoginError } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password: 'Password123!'
      });

      if (devLoginError) {
        Alert.alert('Erro', devLoginError.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro inesperado.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorLogin = async () => {
    const cleanCpf: string = cpf.replace(/\D/g, '');
    if (!cleanCpf || !password) return;
    setIsLoading(true);
    try {
      // 1. Find email by CPF
      // Note: In a real app, this should be a secure RPC or Edge Function to avoid exposing emails.
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('cpf', cleanCpf)
        .single();

      if (profileError || !profiles?.email) {
        Alert.alert('Erro', 'CPF não encontrado ou incorreto.');
        setIsLoading(false);
        return;
      }

      // 2. Sign in with Email/Password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: profiles.email,
        password
      });

      if (authError) {
        Alert.alert('Erro', 'Senha incorreta.');
      }
      // Auto-redirect handles the rest
    } catch (error) {
      Alert.alert('Erro', 'Erro ao tentar fazer login.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorRegistration = async () => {
    if (!docName || !docCpf || !docCrm || !docEmail || !docPhoneBusiness || !docPassword) {
       Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
       return;
    }
    setIsLoading(true);
    try {
      const { doctorService } = await import('../services');
      await doctorService.registerDoctor({
        name: docName,
        cpf: docCpf.replace(/\D/g, ''),
        crm: docCrm,
        phone_business: docPhoneBusiness.replace(/\D/g, ''),
        phone_personal: docPhonePersonal ? docPhonePersonal.replace(/\D/g, '') : undefined,
        email: docEmail,
        password: docPassword
      });
      // Service signs out after registration. Show success and go to doctor login.
      Alert.alert(
        'Cadastro realizado!',
        'Sua conta foi criada com sucesso. Faça login com seu CPF e senha.',
        [{ text: 'OK', onPress: () => setIsRegisteringDoctor(false) }]
      );
    } catch (error: any) {
      Alert.alert('Erro no cadastro', error.message || 'Ocorreu um erro ao cadastrar o médico.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRoleSelection = () => (
    <LinearGradient
      colors={[AppColors.primary[900], AppColors.primary[800], AppColors.primary[700]]}
      style={styles.gradientContainer}
    >
      <View className="flex-1 justify-center items-center px-6 gap-10">
        {/* Logo */}
        <View className="items-center mb-8">
          <View style={styles.iconContainer}>
            <Stethoscope size={64} color="#FFFFFF" strokeWidth={1.5} />
          </View>
          <Text style={styles.titleText}>
            Pós-Operatório Digital
          </Text>
        </View>

        {/* Buttons */}
        <View className="w-full gap-4">
          <Button
            title="Sou Paciente"
            subtitle="Acompanhar minha recuperação"
            icon={<User size={22} color={AppColors.primary[700]} />}
            onPress={() => setRole('patient')}
            variant="light"
          />

          <Button
            title="Sou Médico"
            subtitle="Gerenciar meus pacientes"
            icon={<Stethoscope size={22} color={AppColors.primary[700]} />}
            onPress={() => setRole('doctor')}
            variant="light"
          />
        </View>
      </View>
    </LinearGradient>
  );

  const renderPatientLogin = () => (
    <LinearGradient
      colors={[AppColors.primary[900], AppColors.primary[800], AppColors.primary[700]]}
      style={styles.gradientContainer}
    >
      <View className="flex-1 justify-center px-6">
        <Button
          title="Voltar"
          variant="ghost"
          className="self-start mb-6 pl-0"
          textClassName="text-white"
          onPress={() => setRole('none')}
        />

        <View className="mb-8">
          <Text style={{ color: AppColors.white, fontSize: 24, fontWeight: 'bold' }}>Acesso Paciente</Text>
          <Text style={{ color: `${AppColors.white}99`, marginTop: 8 }}>
            Digite seu telefone com DDD para acessar.
          </Text>
        </View>

        <View className="space-y-4">
          <View style={styles.inputContainer}>
            <FileText size={20} color={AppColors.gray[400]} />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: AppColors.white, fontSize: 16, paddingVertical: 0, height: '100%', textAlignVertical: 'center' }}
              placeholder="(00) 00000-0000"
              placeholderTextColor={AppColors.gray[400]}
              value={patientPhone}
              onChangeText={(v) => setPatientPhone(formatPhone(v))}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <Button
            title="Entrar"
            onPress={handlePatientLogin}
            isLoading={isLoading}
            disabled={patientPhone.replace(/\D/g, '').length < 10}
            variant="light"
            className="mt-4"
          />
        </View>
      </View>
    </LinearGradient>
  );

  const renderDoctorLogin = () => (
    <LinearGradient
      colors={[AppColors.primary[900], AppColors.primary[800], AppColors.primary[700]]}
      style={styles.gradientContainer}
    >
      <View className="flex-1 justify-center px-6">
        <Button
          title="Voltar"
          variant="ghost"
          className="self-start mb-6 pl-0"
          textClassName="text-white"
          onPress={() => setRole('none')}
        />

        <View className="mb-8">
          <Text style={{ color: AppColors.white, fontSize: 24, fontWeight: 'bold' }}>Acesso Médico</Text>
          <Text style={{ color: `${AppColors.white}99`, marginTop: 8 }}>
            Entre com seu CPF e senha.
          </Text>
        </View>

        <View className="space-y-4">
          <View style={[styles.inputContainer, { marginBottom: 12 }]}>
            <FileText size={20} color={AppColors.gray[400]} />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: AppColors.white, fontSize: 16, paddingVertical: 0, height: '100%', textAlignVertical: 'center' }}
              placeholder="CPF"
              placeholderTextColor={AppColors.gray[400]}
              value={cpf}
              onChangeText={(v) => setCpf(v /* formatCPF not available, but user can type */)}
              keyboardType="numeric"
              maxLength={14}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={AppColors.gray[400]} />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: AppColors.white, fontSize: 16, paddingVertical: 0, height: '100%', textAlignVertical: 'center' }}
              placeholder="Senha"
              placeholderTextColor={AppColors.gray[400]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Button
            title="Entrar"
            onPress={handleDoctorLogin}
            isLoading={isLoading}
            disabled={!cpf || !password}
            variant="light"
            className="mt-4"
          />
          <Button
            title="Não possuo cadastro"
            onPress={() => setIsRegisteringDoctor(true)}
            variant="ghost"
            textClassName="text-white"
          />
        </View>
      </View>
    </LinearGradient>
  );

  const renderDoctorRegistration = () => (
    <LinearGradient
      colors={[AppColors.primary[900], AppColors.primary[800], AppColors.primary[700]]}
      style={styles.gradientContainer}
    >
      <View className="flex-1 justify-center px-6 py-10">
        <Button
          title="Voltar"
          variant="ghost"
          className="self-start mb-6 pl-0"
          textClassName="text-white"
          onPress={() => setIsRegisteringDoctor(false)}
        />

        <View className="mb-8">
          <Text style={{ color: AppColors.white, fontSize: 24, fontWeight: 'bold' }}>Cadastro Médico</Text>
          <Text style={{ color: `${AppColors.white}99`, marginTop: 8 }}>
            Preencha seus dados para continuar.
          </Text>
        </View>

        <View className="space-y-4">
          <View style={[styles.inputContainer, { marginBottom: 12 }]}>
            <User size={20} color={AppColors.gray[400]} />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: AppColors.white, fontSize: 16, paddingVertical: 0, height: '100%', textAlignVertical: 'center' }}
              placeholder="Nome Completo *"
              placeholderTextColor={AppColors.gray[400]}
              value={docName}
              onChangeText={setDocName}
            />
          </View>
          
          <View style={[styles.inputContainer, { marginBottom: 12 }]}>
            <FileText size={20} color={AppColors.gray[400]} />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: AppColors.white, fontSize: 16, paddingVertical: 0, height: '100%', textAlignVertical: 'center' }}
              placeholder="CPF *"
              placeholderTextColor={AppColors.gray[400]}
              value={docCpf}
              onChangeText={setDocCpf}
              keyboardType="number-pad"
              maxLength={14}
            />
          </View>

          <View style={[styles.inputContainer, { marginBottom: 12 }]}>
            <FileText size={20} color={AppColors.gray[400]} />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: AppColors.white, fontSize: 16, paddingVertical: 0, height: '100%', textAlignVertical: 'center' }}
              placeholder="CRM *"
              placeholderTextColor={AppColors.gray[400]}
              value={docCrm}
              onChangeText={setDocCrm}
              keyboardType="number-pad"
            />
          </View>

          <View style={[styles.inputContainer, { marginBottom: 12 }]}>
            <FileText size={20} color={AppColors.gray[400]} />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: AppColors.white, fontSize: 16, paddingVertical: 0, height: '100%', textAlignVertical: 'center' }}
              placeholder="E-mail *"
              placeholderTextColor={AppColors.gray[400]}
              value={docEmail}
              onChangeText={setDocEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputContainer, { marginBottom: 12 }]}>
            <Lock size={20} color={AppColors.gray[400]} />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: AppColors.white, fontSize: 16, paddingVertical: 0, height: '100%', textAlignVertical: 'center' }}
              placeholder="Senha *"
              placeholderTextColor={AppColors.gray[400]}
              value={docPassword}
              onChangeText={setDocPassword}
              secureTextEntry
            />
          </View>

          <View style={[styles.inputContainer, { marginBottom: 12 }]}>
            <FileText size={20} color={AppColors.gray[400]} />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: AppColors.white, fontSize: 16, paddingVertical: 0, height: '100%', textAlignVertical: 'center' }}
              placeholder="Telefone Empresarial *"
              placeholderTextColor={AppColors.gray[400]}
              value={docPhoneBusiness}
              onChangeText={(v) => setDocPhoneBusiness(formatPhone(v))}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <View style={[styles.inputContainer, { marginBottom: 24 }]}>
            <FileText size={20} color={AppColors.gray[400]} />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: AppColors.white, fontSize: 16, paddingVertical: 0, height: '100%', textAlignVertical: 'center' }}
              placeholder="Telefone Pessoal (Opcional)"
              placeholderTextColor={AppColors.gray[400]}
              value={docPhonePersonal}
              onChangeText={(v) => setDocPhonePersonal(formatPhone(v))}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <Button
            title="Cadastrar"
            onPress={handleDoctorRegistration}
            isLoading={isLoading}
            variant="light"
          />
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {role === 'none' && renderRoleSelection()}
        {role === 'patient' && renderPatientLogin()}
        {role === 'doctor' && !isRegisteringDoctor && renderDoctorLogin()}
        {role === 'doctor' && isRegisteringDoctor && renderDoctorRegistration()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: `${AppColors.white}33`,

    backgroundColor: `${AppColors.white}14`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '600',
    color: AppColors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  inputContainer: {
    backgroundColor: `${AppColors.white}14`,
    borderWidth: 1,
    borderColor: `${AppColors.white}33`,
    borderRadius: 8,
    height: 48,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
  },
});
