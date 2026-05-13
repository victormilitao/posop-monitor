import { Check, MessageSquarePlus, Pencil, Send, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../../constants/colors';
import { DoctorOrientation } from '../../services/types';

const MAX_CHARS = 300;

interface DoctorOrientationInputProps {
  orientations: DoctorOrientation[];
  isLoading: boolean;
  isSending: boolean;
  onSend: (content: string) => void;
  onEdit: (orientationId: string, content: string) => void;
  onDelete: (orientationId: string) => void;
  isEditing: boolean;
  isDeleting: boolean;
  onInputFocus?: () => void;
  readOnly?: boolean;
}

export function DoctorOrientationInput({
  orientations,
  isLoading,
  isSending,
  onSend,
  onEdit,
  onDelete,
  isEditing,
  isDeleting,
  onInputFocus,
  readOnly = false,
}: DoctorOrientationInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    setIsExpanded(false);
  };

  const handleStartEdit = (orientation: DoctorOrientation) => {
    setEditingId(orientation.id);
    setEditText(orientation.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || !editingId) return;
    onEdit(editingId, trimmed);
    setEditingId(null);
    setEditText('');
  };

  const charsRemaining = MAX_CHARS - text.length;
  const editCharsRemaining = MAX_CHARS - editText.length;

  return (
    <View testID="doctor-orientation-section">
      {/* Existing orientations */}
      {!isLoading && orientations.length > 0 && (
        <View className="mb-4">
          <Text
            className="text-sm font-semibold mb-2"
            style={{ color: AppColors.gray[600] }}
          >
            Orientações enviadas
          </Text>
          {orientations.map((orientation) => (
            <View
              key={orientation.id}
              className="rounded-xl mb-2"
              style={{ backgroundColor: AppColors.info.light, borderWidth: 1, borderColor: '#dbeafe' }}
              testID={`orientation-item-${orientation.id}`}
            >
              {editingId === orientation.id ? (
                /* Edit mode */
                <View className="p-3" testID={`orientation-edit-${orientation.id}`}>
                  <TextInput
                    testID={`orientation-edit-input-${orientation.id}`}
                    value={editText}
                    onChangeText={(value) => {
                      if (value.length <= MAX_CHARS) setEditText(value);
                    }}
                    maxLength={MAX_CHARS}
                    multiline
                    numberOfLines={3}
                    style={{
                      minHeight: 60,
                      textAlignVertical: 'top',
                      color: AppColors.gray[800],
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                    onFocus={onInputFocus}
                  />
                  <View className="flex-row items-center justify-between mt-2">
                    <Text
                      className="text-xs"
                      style={{ color: editCharsRemaining < 50 ? AppColors.warning.DEFAULT : AppColors.gray[400] }}
                    >
                      {editCharsRemaining} caracteres restantes
                    </Text>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        testID={`cancel-edit-${orientation.id}`}
                        onPress={handleCancelEdit}
                        className="p-2 mr-2"
                      >
                        <X size={18} color={AppColors.gray[500]} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`save-edit-${orientation.id}`}
                        onPress={handleSaveEdit}
                        disabled={!editText.trim() || isEditing}
                        className="flex-row items-center px-3 py-1.5 rounded-lg"
                        style={{
                          backgroundColor: editText.trim() ? AppColors.primary[700] : AppColors.gray[200],
                        }}
                      >
                        {isEditing ? (
                          <ActivityIndicator size="small" color={AppColors.white} />
                        ) : (
                          <>
                            <Check size={14} color={editText.trim() ? AppColors.white : AppColors.gray[400]} />
                            <Text
                              className="ml-1 text-sm font-medium"
                              style={{ color: editText.trim() ? AppColors.white : AppColors.gray[400] }}
                            >
                              Salvar
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                /* View mode */
                <View className="flex-row items-start p-3">
                  <Text
                    className="flex-1 text-sm leading-relaxed"
                    style={{ color: AppColors.gray[800] }}
                  >
                    {orientation.content}
                  </Text>
                  {!readOnly && (
                    <>
                      <TouchableOpacity
                        testID={`edit-orientation-${orientation.id}`}
                        onPress={() => handleStartEdit(orientation)}
                        disabled={isDeleting || isEditing}
                        className="ml-2 p-1"
                      >
                        <Pencil size={16} color={AppColors.primary[500]} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`delete-orientation-${orientation.id}`}
                        onPress={() => onDelete(orientation.id)}
                        disabled={isDeleting || isEditing}
                        className="ml-1 p-1"
                      >
                        <Trash2 size={16} color={AppColors.error.DEFAULT} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Toggle button */}
      {!readOnly && !isExpanded && (
        <TouchableOpacity
          testID="add-orientation-button"
          className="flex-row items-center justify-center p-3 rounded-xl border border-dashed"
          style={{ borderColor: AppColors.primary[300] }}
          onPress={() => setIsExpanded(true)}
          activeOpacity={0.7}
        >
          <MessageSquarePlus size={18} color={AppColors.primary[500]} />
          <Text
            className="ml-2 text-sm font-medium"
            style={{ color: AppColors.primary[500] }}
          >
            Adicionar orientação ao paciente
          </Text>
        </TouchableOpacity>
      )}

      {/* Read-only notice */}
      {readOnly && orientations.length === 0 && !isLoading && (
        <View testID="readonly-empty-notice" className="items-center py-6">
          <Text className="text-sm" style={{ color: AppColors.gray[400] }}>
            Nenhuma orientação foi registrada
          </Text>
        </View>
      )}

      {/* Input area */}
      {isExpanded && (
        <View
          className="rounded-xl border p-3"
          style={{ borderColor: AppColors.primary[300], backgroundColor: AppColors.white }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text
              className="text-sm font-semibold"
              style={{ color: AppColors.primary[700] }}
            >
              Nova orientação
            </Text>
            <TouchableOpacity
              testID="close-orientation-input"
              onPress={() => { setIsExpanded(false); setText(''); }}
              className="p-1"
            >
              <X size={18} color={AppColors.gray[400]} />
            </TouchableOpacity>
          </View>
          <TextInput
            testID="orientation-text-input"
            placeholder="Digite a orientação para o paciente..."
            placeholderTextColor={AppColors.gray[400]}
            value={text}
            onChangeText={(value) => {
              if (value.length <= MAX_CHARS) setText(value);
            }}
            maxLength={MAX_CHARS}
            multiline
            numberOfLines={3}
            style={{
              minHeight: 80,
              textAlignVertical: 'top',
              color: AppColors.gray[800],
              fontSize: 14,
              lineHeight: 20,
            }}
            onFocus={onInputFocus}
          />
          <View className="flex-row items-center justify-between mt-2">
            <Text
              className="text-xs"
              style={{ color: charsRemaining < 50 ? AppColors.warning.DEFAULT : AppColors.gray[400] }}
            >
              {charsRemaining} caracteres restantes
            </Text>
            <TouchableOpacity
              testID="send-orientation-button"
              className="flex-row items-center px-4 py-2 rounded-lg"
              style={{
                backgroundColor: text.trim() ? AppColors.primary[700] : AppColors.gray[200],
              }}
              onPress={handleSend}
              disabled={!text.trim() || isSending}
              activeOpacity={0.7}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={AppColors.white} />
              ) : (
                <>
                  <Send size={14} color={text.trim() ? AppColors.white : AppColors.gray[400]} />
                  <Text
                    className="ml-1.5 text-sm font-medium"
                    style={{ color: text.trim() ? AppColors.white : AppColors.gray[400] }}
                  >
                    Enviar
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
