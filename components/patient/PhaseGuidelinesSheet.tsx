import { Stethoscope, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { AppColors } from '../../constants/colors';
import { usePhaseGuidelines } from '../../hooks/useGuidance';
import { useOrientationsBySurgery } from '../../hooks/useOrientations';
import { SurgeryTypePhaseGuideline } from '../../services/types';

interface PhaseGuidelinesSheetProps {
  visible: boolean;
  onClose: () => void;
  currentDay?: number;
  surgeryTypeId?: string | null;
  surgeryId?: string | null;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.87;

const HIGHLIGHT_COLORS = [
  { bg: 'bg-blue-50', text: '' },
  { bg: 'bg-orange-50', text: '' },
  { bg: 'bg-green-50', text: '' },
  { bg: 'bg-purple-50', text: '' },
  { bg: 'bg-teal-50', text: '' },
];

function getActivePhase(
  phases: SurgeryTypePhaseGuideline[],
  currentDay?: number,
): SurgeryTypePhaseGuideline | null {
  if (!phases.length) return null;
  if (currentDay === undefined || currentDay === null) return phases[0];

  // Find matching phases (where currentDay falls in range)
  const matching = phases.filter(p => {
    if (currentDay < p.phase_start_day) return false;
    if (p.phase_end_day === null) return true;
    return currentDay <= p.phase_end_day;
  });

  // Return the one with highest display_order (most advanced applicable phase)
  if (matching.length > 0) {
    return matching.reduce((a, b) => (a.display_order > b.display_order ? a : b));
  }

  // If currentDay is beyond all phases, return the last phase
  return phases[phases.length - 1];
}

export function PhaseGuidelinesSheet({ visible, onClose, currentDay, surgeryTypeId, surgeryId }: PhaseGuidelinesSheetProps) {
  const [mounted, setMounted] = useState(false);
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const { data: phases = [], isLoading } = usePhaseGuidelines(surgeryTypeId);
  const { data: orientations = [] } = useOrientationsBySurgery(surgeryId);

  const activePhase = useMemo(
    () => getActivePhase(phases, currentDay),
    [phases, currentDay],
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

  const highlightColor = activePhase
    ? HIGHLIGHT_COLORS[(activePhase.display_order - 1) % HIGHLIGHT_COLORS.length]
    : HIGHLIGHT_COLORS[0];

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
          backgroundColor: 'white',
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
              Orientações por Fase
            </Text>
            <Text className="text-base text-gray-500">
              O que esperar em cada período
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="p-2 -mr-2 -mt-2 bg-gray-100 rounded-full"
          >
            <X size={20} color="#6b7280" />
          </Pressable>
        </View>

        {/* Current Phase Label */}
        {activePhase && (
          <View className="px-6 mb-6">
            <View className="bg-primary-100 p-3 rounded-2xl items-center">
              <Text style={{ fontWeight: '600', color: '#1B3A5C' }}>
                {activePhase.phase_title} (Fase Atual)
              </Text>
            </View>
          </View>
        )}

        {/* Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6">
            {isLoading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#1B3A5C" />
                <Text className="text-gray-500 mt-4">Carregando orientações...</Text>
              </View>
            ) : !activePhase ? (
              <View className="py-12 items-center">
                <Text className="text-gray-500">Nenhuma orientação disponível.</Text>
              </View>
            ) : (
              <View style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 24, padding: 24, overflow: 'hidden' }}>
                {/* Left Accent Border */}
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: '#1B3A5C', borderTopLeftRadius: 24, borderBottomLeftRadius: 24 }} />

                <Text className="text-xl font-bold text-gray-900 mb-6 pl-2">
                  {activePhase.phase_title}
                </Text>

                {activePhase.phase_subtitle && (
                  <Text className="text-lg italic text-gray-700 mb-8 pl-2">
                    &quot;{activePhase.phase_subtitle}&quot;
                  </Text>
                )}

                <View className="pl-2 mb-8">
                  {activePhase.items.map((item) => (
                    <View key={item} className="flex-row items-start mb-3">
                      <Text className="text-gray-400 mr-3 text-lg mt-0.5">•</Text>
                      <Text className="flex-1 text-gray-800 text-base leading-relaxed">{item}</Text>
                    </View>
                  ))}
                </View>

                {activePhase.highlight_text && (
                  <View className={`flex-row items-start mt-4 ${highlightColor.bg} p-4 rounded-xl`}>
                    <Text className="text-xl mr-2">👉</Text>
                    <Text className="flex-1 text-gray-800 text-base leading-relaxed">
                      {activePhase.highlight_text}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Doctor Orientations */}
            {orientations.length > 0 && (
              <View testID="doctor-orientations-section" className="mt-6 mb-4">
                {orientations.map((orientation) => (
                  <View
                    key={orientation.id}
                    testID={`patient-orientation-${orientation.id}`}
                    className="flex-row items-start p-4 rounded-xl mb-3"
                    style={{
                      backgroundColor: AppColors.info.light,
                      borderWidth: 1,
                      borderColor: '#dbeafe',
                    }}
                  >
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: AppColors.primary[100] }}
                    >
                      <Stethoscope size={16} color={AppColors.primary[700]} />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-xs font-semibold mb-1"
                        style={{ color: AppColors.primary[700] }}
                      >
                        Orientação do seu médico
                      </Text>
                      <Text
                        className="text-sm leading-relaxed"
                        style={{ color: AppColors.gray[800] }}
                      >
                        {orientation.content}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
