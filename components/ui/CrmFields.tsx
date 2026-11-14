import { ChevronDown } from 'lucide-react-native';
import { PickerModal } from './SearchablePickerModal';
import { useState } from 'react';
import { Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';

const states = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'],
  ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
  ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins'],
];
export const isValidCrm = (value: string) => /^\d{4,6}\/[A-Z]{2}$/.test(value) && states.some(([uf]) => uf === value.split('/')[1]);

export function CrmFields({ value, onChange, disabled = false, dark = false }: {
  value: string; onChange: (value: string) => void; disabled?: boolean; dark?: boolean;
}) {
  const [number = '', uf = ''] = value.split('/');
  const [expanded, setExpanded] = useState(false);
  const labelColor = dark ? '#fff' : '#374151';
  const inputStyle = { color: labelColor, backgroundColor: dark ? 'rgba(255,255,255,0.1)' : '#fff', borderColor: dark ? 'rgba(255,255,255,0.2)' : '#e5e7eb', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 };
  return <View style={{ marginBottom: 16 }}>
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ flex: 1 }}><Text style={{ color: labelColor, marginBottom: 8 }}>CRM *</Text>
        <TextInput accessibilityLabel="CRM *" placeholder="Número do CRM" placeholderTextColor="#9ca3af" value={number} keyboardType="number-pad" maxLength={6} editable={!disabled} style={inputStyle} onChangeText={text => onChange(`${text.replace(/\D/g, '').slice(0, 6)}/${uf}`)} />
      </View>
      <View style={{ flex: 1 }}><Text style={{ color: labelColor, marginBottom: 8 }}>UF *</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="UF *" accessibilityState={{ disabled }} disabled={disabled}
          style={[inputStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          onPress={() => { Keyboard.dismiss(); setExpanded(true); }}>
          <Text style={{ color: uf ? labelColor : '#9ca3af', fontSize: 16 }}>{uf || 'Selecione a UF'}</Text>
          <ChevronDown size={20} color={labelColor} />
        </TouchableOpacity>
      </View>
    </View>
    <PickerModal
      visible={expanded && !disabled}
      onClose={() => setExpanded(false)}
      onSelect={option => onChange(`${number}/${option.id}`)}
      options={states.map(([id, name]) => ({ id, label: `${id} — ${name}` }))}
      selectedId={uf}
      title="Selecionar UF"
      searchPlaceholder="Buscar por sigla ou estado"
      emptyMessage="Nenhum estado encontrado."
    />
  </View>;
}
