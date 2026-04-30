import { LinearGradient } from 'expo-linear-gradient';
import { Href, Stack, useRouter } from 'expo-router';
import { FileText, Lock, Stethoscope, User } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { AppColors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';



export default function LoginScreen() {
  const router = useRouter();
  const { session, profile, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
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
  const isRegisteringRef = useRef(false);

  // Auto-redirect if logged in
  useEffect(() => {
    if (isRegisteringRef.current) return;
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

  const formatCPF = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatCRM = (value: string): string => {
    // Remove everything except digits, letters, and slash
    const clean = value.replace(/[^0-9a-zA-Z/]/g, '');
    // Extract digits part (first 6 digits)
    const digits = clean.replace(/[^0-9]/g, '').slice(0, 6);
    // Extract letters part (after the slash or after 6 digits)
    const slashIndex = clean.indexOf('/');
    let letters = '';
    if (slashIndex !== -1) {
      letters = clean.slice(slashIndex + 1).replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
    } else if (digits.length === 6) {
      // If user typed 6 digits and then letters without slash
      letters = clean.slice(6).replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
    }
    if (digits.length < 6) return digits;
    if (letters.length > 0) return `${digits}/${letters}`;
    // Auto-add slash after 6 digits if user is still typing
    if (digits.length === 6 && clean.includes('/')) return `${digits}/`;
    return digits;
  };

  const handlePatientLogin = async () => {
    const cleanPhone: string = patientPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast({ type: 'warning', title: 'Atenção', message: 'Número de telefone inválido.' });
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
        showToast({ type: 'error', title: 'Não encontrado', message: 'Não encontramos um cadastro com esse número de telefone.' });
        setIsLoading(false);
        return;
      }

      // Sign in with the email associated with the phone
      const { error: devLoginError } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password: 'Password123!'
      });

      if (devLoginError) {
        showToast({ type: 'error', title: 'Erro', message: devLoginError.message });
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Erro', message: 'Ocorreu um erro inesperado.' });
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
        showToast({ type: 'error', title: 'Erro', message: 'CPF não encontrado ou incorreto.' });
        setIsLoading(false);
        return;
      }

      // 2. Sign in with Email/Password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: profiles.email,
        password
      });

      if (authError) {
        showToast({ type: 'error', title: 'Erro', message: 'Senha incorreta.' });
      }
      // Auto-redirect handles the rest
    } catch (error) {
      showToast({ type: 'error', title: 'Erro', message: 'Erro ao tentar fazer login.' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorRegistration = async () => {
    if (!docName || !docCpf || !docCrm || !docEmail || !docPhoneBusiness || !docPassword) {
      showToast({ type: 'warning', title: 'Atenção', message: 'Preencha todos os campos obrigatórios.' });
      return;
    }
    const crmRegex = /^\d{6}\/[A-Z]{2}$/;
    if (!crmRegex.test(docCrm)) {
      showToast({ type: 'warning', title: 'Atenção', message: 'CRM inválido. Use o formato 123456/UF (6 dígitos + sigla do estado).' });
      return;
    }
    setIsLoading(true);
    isRegisteringRef.current = true;
    try {
      const { doctorService } = await import('../services');
      await doctorService.registerDoctor({
        name: docName,
        cpf: docCpf.replace(/\D/g, ''),
        crm: docCrm,
        phone_business: docPhoneBusiness.replace(/\D/g, ''),
        phone_personal: docPhonePersonal ? docPhonePersonal.replace(/\D/g, '') : undefined,
        email: docEmail.trim().toLowerCase(),
        password: docPassword
      });
      // Service signs out after registration. Show success and go to doctor login.
      setIsRegisteringDoctor(false);
      setRole('doctor');
      showToast({ type: 'success', title: 'Cadastro realizado!', message: 'Faça login com seu CPF e senha.' });
    } catch (error: any) {
      showToast({ type: 'error', title: 'Erro no cadastro', message: error.message || 'Ocorreu um erro ao cadastrar o médico.' });
    } finally {
      isRegisteringRef.current = false;
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
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 250, height: 250 }}
            resizeMode="contain"
          />
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
              placeholder="000.000.000-00"
              placeholderTextColor={AppColors.gray[400]}
              value={cpf}
              onChangeText={(v) => setCpf(formatCPF(v))}
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
              placeholder="000.000.000-00 *"
              placeholderTextColor={AppColors.gray[400]}
              value={docCpf}
              onChangeText={(v) => setDocCpf(formatCPF(v))}
              keyboardType="number-pad"
              maxLength={14}
            />
          </View>

          <View style={[styles.inputContainer, { marginBottom: 12 }]}>
            <FileText size={20} color={AppColors.gray[400]} />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: AppColors.white, fontSize: 16, paddingVertical: 0, height: '100%', textAlignVertical: 'center' }}
              placeholder="123456/UF *"
              placeholderTextColor={AppColors.gray[400]}
              value={docCrm}
              onChangeText={(v) => setDocCrm(formatCRM(v))}
              autoCapitalize="characters"
              maxLength={9}
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
      style={{ backgroundColor: AppColors.primary[900] }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: AppColors.primary[900] }}>
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
