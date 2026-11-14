import { CrmFields, isValidCrm } from '../../components/ui/CrmFields';
import { Redirect, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TextInputProps, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { ToastData } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { formatPhone } from '../../lib/formatPhone';

const emptyForm = { full_name: '', display_name: '', specialty: '', rqe: '', cpf: '', crm: '', phone: '', phone_personal: '', email: '', password: '' };
type Form = typeof emptyForm;

function saveErrorMessage(error: unknown): string {
  const failure = error && typeof error === 'object' ? error as { code?: unknown; message?: unknown } : {};
  const code = typeof failure.code === 'string' ? failure.code : '';
  const message = typeof failure.message === 'string' ? failure.message.trim() : typeof error === 'string' ? error : '';
  let reason = message || 'O servidor não informou o motivo da falha.';
  if (code === '23505') reason = 'CPF, CRM ou telefone já cadastrado em outra conta.';
  else if (code === '42703' || code === 'PGRST204') reason = `O banco de dados ainda não reconhece um dos campos do perfil. É necessário atualizar sua estrutura.${message ? ` Detalhe: ${message}` : ''}`;
  else if (code === '42501') reason = 'Sua conta não tem permissão para atualizar este perfil.';
  else if (/network request failed|failed to fetch/i.test(message)) reason = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  return `${reason}${code ? ` (Código: ${code})` : ''} Suas alterações foram mantidas nesta tela.`;
}

function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View className="mb-4"><Text className="text-sm font-semibold text-gray-700 mb-2">{label}</Text><TextInput accessibilityLabel={label} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900" placeholderTextColor="#9ca3af" {...props} /></View>;
}

export default function DoctorProfile() {
  const router = useRouter();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const [closing, setClosing] = useState<Omit<ToastData, 'id'> | null>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const entrance = useRef(new Animated.Value(0)).current;
  const { profile, user, isDoctor, isLoading, refreshProfile } = useAuth();
  const [feedback, setFeedback] = useState<Omit<ToastData, 'id'> | null>(null);
  const showFeedback = (message: Omit<ToastData, 'id'>) => {
    setFeedback(message);
  };
  const [form, setForm] = useState<Form>(emptyForm);
  const [initial, setInitial] = useState<Form>(emptyForm);
  const initialized = useRef(false);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  useEffect(() => {
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [entrance]);

  useEffect(() => {
    if (!profile || initialized.current) return;
    const values = { ...emptyForm };
    for (const key of Object.keys(values) as (keyof Form)[]) {
      if (key !== 'password' && key !== 'email') values[key] = profile[key] || '';
    }
    values.email = user?.email || profile.email || '';
    values.phone = formatPhone(values.phone);
    values.phone_personal = formatPhone(values.phone_personal);
    setForm(values);
    setInitial(values);
    initialized.current = true;
  }, [profile, user]);

  usePreventRemove(!closing && (dirty || saving), ({ data }) => {
    if (savingRef.current) return;
    Alert.alert('Descartar alterações?', 'Você tem alterações que ainda não foram salvas.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });
  // Start after the render that releases the unsaved-changes navigation guard.
  useEffect(() => {
    if (!closing) return;
    const animation = Animated.timing(entrance, {
      toValue: 0,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (!finished) return;
      router.back();
      showToast(closing);
    });
    return () => animation.stop();
  }, [closing, entrance, router, showToast]);

  const update = (key: keyof Form, value: string) => {
    setFeedback(null);
    setForm(current => ({ ...current, [key]: value }));
  };

  const save = async () => {
    if (savingRef.current || closing || !user || !isDoctor) return;
    const email = form.email.trim().toLowerCase();
    const cpf = form.cpf.replace(/\D/g, '');
    const phone = form.phone.replace(/\D/g, '');
    const personal = form.phone_personal.replace(/\D/g, '');
    const crm = form.crm.trim().toUpperCase();
    const invalidFields = [
      !form.full_name.trim() && 'nome completo',
      cpf.length !== 11 && 'CPF (11 dígitos)',
      !isValidCrm(crm) && 'CRM e UF',
      !/^\S+@\S+\.\S+$/.test(email) && 'e-mail',
      !/^\d{10,11}$/.test(phone) && 'telefone profissional com DDD',
      personal && !/^\d{10,11}$/.test(personal) && 'telefone pessoal com DDD',
      form.password && form.password.length < 6 && 'nova senha (mínimo de 6 caracteres)',
    ].filter(Boolean);
    if (invalidFields.length) {
      showFeedback({ type: 'warning', title: 'Confira os dados', message: `Corrija: ${invalidFields.join(', ')}.` });
      return;
    }
    setFeedback(null);
    savingRef.current = true;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name.trim(), display_name: form.display_name.trim() || null,
        specialty: form.specialty.trim() || null, rqe: form.rqe || null,
        cpf, crm, phone, phone_personal: personal || null,
      }).eq('id', user.id).select('id').single();
      if (error) throw error;
      await refreshProfile();
      const saved = { ...form, password: '', email: initial.email };
      setInitial(saved);
      const emailChanged = email !== user.email?.toLowerCase();
      if (emailChanged || form.password) {
        const { error: authError } = await supabase.auth.updateUser({ ...(emailChanged ? { email } : {}), ...(form.password ? { password: form.password } : {}) });
        if (authError) {
          showFeedback({ type: 'error', title: 'Perfil salvo; acesso não atualizado', message: authError.message });
          return;
        }
      }
      setForm(saved);
      setClosing({ type: 'success', title: 'Perfil atualizado', message: emailChanged ? 'Confira seu e-mail para confirmar a alteração de endereço.' : 'Suas alterações foram salvas.' });
    } catch (error: unknown) {
      showFeedback({ type: 'error', title: 'Não foi possível salvar', message: saveErrorMessage(error) });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (isLoading) return <View className="flex-1 items-center justify-center"><ActivityIndicator /></View>;
  if (!user || !isDoctor) return <Redirect href="/" />;
  const field = (key: keyof Form, label: string, props: TextInputProps = {}) => <Field label={label} value={form[key]} onChangeText={value => update(key, value)} editable={!saving && !closing} {...props} />;
  return (
    <Animated.View style={{ flex: 1, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [-height, 0] }) }] }}>
    <KeyboardAvoidingView className="flex-1 bg-gray-100" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View className="bg-primary-700 px-6 pb-5" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center justify-between"><Text className="text-2xl font-bold text-white">Meu perfil</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar perfil" disabled={saving || !!closing} onPress={() => router.back()} className="p-2"><X color="white" size={24} /></TouchableOpacity></View>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24 }}>
        <Text className="text-lg font-bold text-gray-900 mb-4">Apresentação profissional</Text>
        {field('display_name', 'Nome de apresentação', { placeholder: 'Ex.: Dr. Victor' })}
        <Text className="text-sm text-gray-500 mb-4">Este nome aparece no topo da tela inicial. Se ficar vazio, usaremos seu nome completo.</Text>
        {field('specialty', 'Especialidade', { placeholder: 'Ex.: Cirurgia geral' })}
        {field('rqe', 'RQE', { keyboardType: 'number-pad', placeholder: 'Número do registro', onChangeText: value => update('rqe', value.replace(/\D/g, '')) })}
        <Text className="text-lg font-bold text-gray-900 mt-2 mb-4">Dados de cadastro</Text>
        {field('full_name', 'Nome completo *', { autoCapitalize: 'words' })}
        {field('cpf', 'CPF *', { keyboardType: 'number-pad', maxLength: 14 })}
        <CrmFields value={form.crm} onChange={value => update('crm', value)} disabled={saving || !!closing} />
        {field('phone', 'Telefone profissional *', { keyboardType: 'phone-pad', maxLength: 15, onChangeText: value => update('phone', formatPhone(value)) })}
        {field('phone_personal', 'Telefone pessoal', { keyboardType: 'phone-pad', maxLength: 15, onChangeText: value => update('phone_personal', formatPhone(value)) })}
        {field('email', 'E-mail *', { keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false })}
        {field('password', 'Nova senha', { secureTextEntry: true, autoCapitalize: 'none', autoCorrect: false, placeholder: 'Deixe vazio para manter a senha' })}
      </ScrollView>
      <View className="px-6 pt-3 bg-white" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>{feedback && (
        <View accessibilityRole="alert" accessibilityLiveRegion="polite" className="mb-3">
          <Text className={feedback.type === 'success' ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>{feedback.title}</Text>
          <Text className="text-sm text-gray-700 mt-1">{feedback.message}</Text>
        </View>
      )}<Button title="Salvar alterações" onPress={save} isLoading={saving || !!closing} disabled={saving || !!closing || !dirty} /></View>
    </KeyboardAvoidingView>
    </Animated.View>
  );
}
