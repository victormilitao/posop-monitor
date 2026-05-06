import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppColors } from '../../constants/colors';

export interface AutocompleteInputProps extends Omit<TextInputProps, 'onChangeText'> {
  /** Current text value */
  value: string;
  /** Called when the text changes */
  onChangeText: (text: string) => void;
  /** List of suggestion strings to filter and display */
  suggestions: string[];
  /** Maximum suggestions to display at once */
  maxSuggestions?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
}

export function AutocompleteInput({
  value,
  onChangeText,
  suggestions,
  maxSuggestions = 5,
  disabled = false,
  testID,
  ...textInputProps
}: AutocompleteInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (!value.trim() || !isFocused) return [];

    const query = value.trim().toLowerCase();
    return suggestions
      .filter(
        (s) =>
          s.toLowerCase().includes(query) &&
          s.toLowerCase() !== query
      )
      .slice(0, maxSuggestions);
  }, [value, suggestions, isFocused, maxSuggestions]);

  const handleSelect = useCallback(
    (suggestion: string) => {
      onChangeText(suggestion);
      setIsFocused(false);
    },
    [onChangeText]
  );

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text);
      if (!isFocused) setIsFocused(true);
    },
    [onChangeText, isFocused]
  );

  const showSuggestions = isFocused && filteredSuggestions.length > 0 && !disabled;

  return (
    <View>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          // Delay to allow suggestion tap to register
          setTimeout(() => setIsFocused(false), 200);
        }}
        editable={!disabled}
        {...textInputProps}
      />
      {showSuggestions && (
        <View
          testID={testID ? `${testID}-suggestions` : 'autocomplete-suggestions'}
          style={{
            backgroundColor: AppColors.white,
            borderWidth: 1,
            borderColor: AppColors.gray[200],
            borderRadius: 12,
            marginTop: 4,
            overflow: 'hidden',
          }}
        >
          <FlatList
            data={filteredSuggestions}
            keyExtractor={(item) => item}
            scrollEnabled={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <TouchableOpacity
                testID={testID ? `${testID}-suggestion-${index}` : `suggestion-${index}`}
                onPress={() => handleSelect(item)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: index < filteredSuggestions.length - 1 ? 1 : 0,
                  borderBottomColor: AppColors.gray[100],
                }}
                activeOpacity={0.6}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: AppColors.gray[700],
                  }}
                  numberOfLines={1}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}
