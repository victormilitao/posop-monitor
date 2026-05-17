import { AlertCircle, AlertTriangle, CheckCircle, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { AppColors } from '../../constants/colors';
import { useSignsBySurgeryType } from '../../hooks/useGuidance';
import { SurgeryTypeSign } from '../../services/types';

interface PostReportFeedbackSheetProps {
  visible: boolean;
  onClose: () => void;
  surgeryTypeId?: string | null;
  resultStatus?: 'critical' | 'warning' | 'stable';
  alertMessages?: string[];
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.87;

interface SignCategoryConfig {
  key: SurgeryTypeSign['category'];
  statusKey: 'critical' | 'warning' | 'stable';
  title: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
  icon: typeof AlertCircle;
}

const CATEGORIES: SignCategoryConfig[] = [
  {
    key: 'alert',
    statusKey: 'critical',
    title: 'Sinais de Alerta',
    bgColor: AppColors.error.light,
    borderColor: '#FECACA',
    textColor: AppColors.error.dark,
    iconColor: AppColors.error.DEFAULT,
    icon: AlertCircle,
  },
  {
    key: 'attention',
    statusKey: 'warning',
    title: 'Sinais de Atenção',
    bgColor: AppColors.warning.light,
    borderColor: '#FDE68A',
    textColor: AppColors.warning.dark,
    iconColor: AppColors.warning.DEFAULT,
    icon: AlertTriangle,
  },
  {
    key: 'normal',
    statusKey: 'stable',
    title: 'Sinais de Normalidade',
    bgColor: AppColors.success.light,
    borderColor: '#A7F3D0',
    textColor: AppColors.success.dark,
    iconColor: AppColors.success.DEFAULT,
    icon: CheckCircle,
  },
];

export function PostReportFeedbackSheet({ visible, onClose, surgeryTypeId, resultStatus, alertMessages = [] }: PostReportFeedbackSheetProps) {
  const [mounted, setMounted] = useState(false);
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const hasRealAlerts = alertMessages.length > 0;

  // Only fetch generic signs if there are no real alert messages
  const { data: signs = [], isLoading } = useSignsBySurgeryType(
    hasRealAlerts ? null : surgeryTypeId
  );

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  // Determine category config based on the result status
  const activeCategory = CATEGORIES.find(cat => cat.statusKey === resultStatus);
  const stableCategory = CATEGORIES.find(cat => cat.statusKey === 'stable')!;

  const renderRealAlerts = () => {
    if (!hasRealAlerts) return null;

    // Show the real alerts in the category matching the result
    const category = activeCategory || CATEGORIES[0];
    const IconComponent = category.icon;

    return (
      <View
        style={{
          backgroundColor: category.bgColor,
          borderWidth: 1,
          borderColor: category.borderColor,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <View className="flex-row items-center mb-3">
          <IconComponent size={20} color={category.iconColor} />
          <Text
            style={{ color: category.textColor }}
            className="font-bold text-base ml-2"
          >
            {category.title}
          </Text>
        </View>
        {alertMessages.map((message, index) => (
          <View key={index} className="flex-row items-start mb-2 ml-1">
            <Text style={{ color: category.textColor }} className="mr-2 mt-0.5">•</Text>
            <Text
              style={{ color: category.textColor }}
              className="flex-1 text-sm leading-5"
            >
              {message}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderGenericSigns = () => {
    if (hasRealAlerts) return null;

    const categoriesToShow = activeCategory ? [activeCategory] : CATEGORIES;
    const signsByCategory = categoriesToShow.map(cat => ({
      ...cat,
      signs: signs.filter(s => s.category === cat.key),
    }));

    if (isLoading) {
      return (
        <View className="py-12 items-center">
          <ActivityIndicator size="large" color={AppColors.primary[700]} />
          <Text className="text-gray-500 mt-4">Carregando orientações...</Text>
        </View>
      );
    }

    return signsByCategory.map((category) => {
      if (category.signs.length === 0) return null;
      const IconComponent = category.icon;
      return (
        <View
          key={category.key}
          style={{
            backgroundColor: category.bgColor,
            borderWidth: 1,
            borderColor: category.borderColor,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          {/* Category Header */}
          <View className="flex-row items-center mb-3">
            <IconComponent size={20} color={category.iconColor} />
            <Text
              style={{ color: category.textColor }}
              className="font-bold text-base ml-2"
            >
              {category.title}
            </Text>
          </View>

          {/* Signs List */}
          {category.signs.map((sign) => (
            <View key={sign.id} className="flex-row items-start mb-2 ml-1">
              <Text style={{ color: category.textColor }} className="mr-2 mt-0.5">•</Text>
              <Text
                style={{ color: category.textColor }}
                className="flex-1 text-sm leading-5"
              >
                {sign.description}
              </Text>
            </View>
          ))}
        </View>
      );
    });
  };

  const renderStableMessage = () => {
    if (resultStatus !== 'stable') return null;

    const IconComponent = stableCategory.icon;
    return (
      <View
        style={{
          backgroundColor: stableCategory.bgColor,
          borderWidth: 1,
          borderColor: stableCategory.borderColor,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <View className="flex-row items-center mb-3">
          <IconComponent size={20} color={stableCategory.iconColor} />
          <Text
            style={{ color: stableCategory.textColor }}
            className="font-bold text-base ml-2"
          >
            {stableCategory.title}
          </Text>
        </View>
        <Text
          style={{ color: stableCategory.textColor }}
          className="text-sm leading-5 ml-1"
        >
          Suas respostas não indicaram sinais de alerta. Continue seguindo as orientações médicas.
        </Text>
      </View>
    );
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
      {/* Backdrop */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: backdropOpacity,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: SHEET_HEIGHT,
          backgroundColor: AppColors.white,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 8,
          paddingBottom: 32,
          transform: [{ translateY }],
        }}
      >
        {/* Header Handle */}
        <View className="items-center mb-4">
          <View className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </View>

        {/* Header Content */}
        <View className="flex-row justify-between items-start px-6 mb-6">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              Relatório Enviado ✓
            </Text>
            <Text className="text-base text-gray-500">
              {resultStatus === 'critical'
                ? 'Atenção! Identificamos sinais que requerem cuidado.'
                : resultStatus === 'warning'
                  ? 'Alguns sinais merecem sua atenção.'
                  : 'Suas respostas indicam recuperação dentro do esperado.'}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="p-2 -mr-2 -mt-2 bg-gray-100 rounded-full"
          >
            <X size={20} color={AppColors.gray[500]} />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 pb-8">
            {hasRealAlerts ? renderRealAlerts() : (
              resultStatus === 'stable' ? renderStableMessage() : renderGenericSigns()
            )}

            {/* Close Button */}
            <Pressable
              onPress={onClose}
              style={{ backgroundColor: AppColors.primary[700] }}
              className="py-4 rounded-xl items-center mt-4"
            >
              <Text className="text-white font-bold text-lg">Entendi</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
