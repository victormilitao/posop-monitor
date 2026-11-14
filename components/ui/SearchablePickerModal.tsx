import { X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../../constants/colors';

export interface PickerOption {
  id: string;
  label: string;
}

interface PickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: PickerOption) => void;
  options: PickerOption[];
  selectedId?: string;
  title?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
}

export function PickerModal({
  visible,
  onClose,
  onSelect,
  options,
  selectedId,
  title = 'Selecionar',
  emptyMessage = 'Nenhuma opção disponível.',
  searchPlaceholder,
}: PickerModalProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  useEffect(() => { if (visible) setSearch(''); }, [visible]);
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const filteredOptions = searchPlaceholder
    ? options.filter(option => normalize(option.label).includes(normalize(search)))
    : options;

  const handleSelect = useCallback(
    (option: PickerOption) => {
      onSelect(option);
      onClose();
    },
    [onSelect, onClose]
  );

  const renderItem = useCallback(
    ({ item }: { item: PickerOption }) => {
      const isSelected = item.id === selectedId;
      return (
        <TouchableOpacity
          testID={`picker-option-${item.id}`}
          className={`mx-4 mb-2 rounded-xl px-4 py-3 ${
            isSelected
              ? 'border border-primary-700 bg-primary-100'
              : 'bg-gray-50'
          }`}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
        >
          <Text
            className={`text-base font-medium ${
              isSelected ? 'text-primary-700' : 'text-gray-700'
            }`}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedId, handleSelect]
  );

  const keyExtractor = useCallback((item: PickerOption) => item.id, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
          <Text className="text-lg font-semibold text-gray-800">{title}</Text>
          <TouchableOpacity
            testID="picker-close-btn"
            onPress={onClose}
            className="rounded-full p-2"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={22} color={AppColors.gray[500]} />
          </TouchableOpacity>
        </View>

        {searchPlaceholder && (
          <TextInput
            accessibilityLabel={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            className="mx-4 mt-4 rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900"
          />
        )}

        {/* Options list */}
        <FlatList
          data={filteredOptions}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 16 }}
          ListEmptyComponent={
            <View className="items-center px-4 py-12">
              <Text className="text-base text-gray-400">{emptyMessage}</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}
