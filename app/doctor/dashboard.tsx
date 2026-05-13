import { useQueryClient } from '@tanstack/react-query';
import { Redirect, Stack, useRouter } from 'expo-router';
import { FileText, LogOut, Plus, Search, Users } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MedicalRecordListItem } from '../../components/doctor/MedicalRecordListItem';
import { PatientListItem, PatientStatus } from '../../components/doctor/PatientListItem';
import { StatsGrid } from '../../components/doctor/StatsGrid';
import { Button } from '../../components/ui/Button';
import { AppColors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useAutoFinalizeSurgeries, useCompletedSurgeriesByDoctor, useSurgeriesByDoctor } from '../../hooks/useSurgeries';

type DashboardTab = 'patients' | 'records';

interface Patient {
  id: string;
  name: string;
  surgeryType?: string;
  surgeryDate: string;
  day: number;
  status: PatientStatus;
  lastResponseDate: string | null;
  alerts?: string[];
  medicalStatus?: string;
  sex?: string | null;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, isLoading: isAuthLoading, isDoctor, signOut, profile } = useAuth();
  const [filterStatus, setFilterStatus] = useState<PatientStatus>('critical');
  const [activeTab, setActiveTab] = useState<DashboardTab>('patients');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const insets = useSafeAreaInsets();

  // Debounce search input (300ms)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchInput]);

  // Use React Query hook for surgeries
  const { data: surgeriesData, isLoading: isSurgeriesLoading } = useSurgeriesByDoctor(profile?.id);

  // Use infinite query for completed surgeries (prontuários)
  const {
    data: completedData,
    isLoading: isCompletedLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCompletedSurgeriesByDoctor(profile?.id, debouncedSearch || undefined);

  // Auto-finalize surgeries past 14 days on dashboard load
  useAutoFinalizeSurgeries(profile?.id);

  // Transform surgery data for UI
  const patients = useMemo<Patient[]>(() => {
    if (!surgeriesData) return [];

    return surgeriesData.map((surgery) => {
      // Create local date from YYYY-MM-DD to avoid UTC shift
      const dateParts = surgery.surgery_date.split('T')[0].split('-');
      const surgeryDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today to midnight for accurate diff
      const daysSinceSurgery = Math.floor((today.getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24));

      // Map surgery status to patient status using the new medical_status field if available, 
      // otherwise fallback to logic or default to stable if cancelled/completed
      let patientStatus: PatientStatus = 'stable';

      if (surgery.status === 'completed') {
        patientStatus = 'finished';
      } else if (surgery.status === 'pending_return') {
        patientStatus = 'pending_return';
      } else if (surgery.status === 'cancelled') {
        patientStatus = 'stable';
      } else if (surgery.medical_status) {
        // Use the persisted status from database
        patientStatus = surgery.medical_status as PatientStatus;
      } else {
        // Fallback for old records without medical_status
        patientStatus = daysSinceSurgery <= 3 ? 'critical' :
          daysSinceSurgery <= 7 ? 'warning' : 'stable';
      }

      return {
        id: surgery.id, // Use surgery.id instead of patient_id as unique key
        name: surgery.patient?.full_name || 'Sem nome',
        surgeryDate: surgeryDate.toLocaleDateString('pt-BR'),
        day: Math.max(0, daysSinceSurgery),
        surgeryType: surgery.surgery_type?.name || 'Não especificado',
        status: patientStatus,
        lastResponseDate: surgery.lastResponseDate || null,
        alerts: patientStatus === 'critical' ? ['Requer atenção'] : patientStatus === 'warning' ? ['Monitorar'] : undefined,
        sex: (surgery.patient as any)?.sex || null
      };
    });
  }, [surgeriesData]);

  // Flatten paginated completed surgeries
  const completedRecords = useMemo(() => {
    if (!completedData?.pages) return [];
    return completedData.pages.flatMap(page => page.data);
  }, [completedData]);

  // Filter patients based on selection
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      if (filterStatus === 'finished') {
        return p.status === 'finished' || p.status === 'pending_return';
      }
      return p.status === filterStatus;
    });
  }, [patients, filterStatus]);

  // Calculate counts for StatsGrid
  const statsCounts = useMemo(() => {
    const counts = {
      critical: 0,
      warning: 0,
      stable: 0,
      finished: 0,
      pendingReturn: 0
    };
    patients.forEach(p => {
      if (p.status === 'critical') counts.critical++;
      else if (p.status === 'warning') counts.warning++;
      else if (p.status === 'stable') counts.stable++;
      else if (p.status === 'pending_return') counts.pendingReturn++;
      else if (p.status === 'finished') counts.finished++;
    });
    return counts;
  }, [patients]);

  const handleLogout = async () => {
    await signOut();
  };

  const handlePatientClick = (surgeryId: string) => {
    router.push({ pathname: '/doctor/patient-timeline/[surgeryId]', params: { surgeryId } });
  };

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isAuthLoading) return <View className="flex-1 justify-center items-center"><Text>Carregando...</Text></View>;
  if (!session || !isDoctor) return <Redirect href="/" />;

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        className="bg-primary-700 px-6 pb-6 rounded-b-3xl"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-white">{profile?.full_name || ''}</Text>
          <Button
            title="Sair"
            variant="ghost"
            onPress={handleLogout}
            icon={<LogOut size={16} color="#fff" />}
            className="h-8 px-2 rounded-xl"
            textClassName="text-white"
          />
        </View>
      </View>

      {/* Tab Selector */}
      <View
        className="flex-row mx-5 mt-4 mb-2 rounded-xl p-1"
        style={{ backgroundColor: AppColors.gray[200] }}
      >
        <TouchableOpacity
          testID="tab-patients"
          className="flex-1 flex-row items-center justify-center py-2.5"
          style={{
            backgroundColor: activeTab === 'patients' ? AppColors.primary[700] : 'transparent',
            borderRadius: 10,
          }}
          onPress={() => setActiveTab('patients')}
        >
          <Users
            size={16}
            color={activeTab === 'patients' ? AppColors.white : AppColors.primary[700]}
            style={{ marginRight: 6 }}
          />
          <Text
            className="font-semibold text-sm"
            style={{ color: activeTab === 'patients' ? AppColors.white : AppColors.primary[700] }}
          >
            Pacientes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="tab-records"
          className="flex-1 flex-row items-center justify-center py-2.5"
          style={{
            backgroundColor: activeTab === 'records' ? AppColors.primary[700] : 'transparent',
            borderRadius: 10,
          }}
          onPress={() => setActiveTab('records')}
        >
          <FileText
            size={16}
            color={activeTab === 'records' ? AppColors.white : AppColors.primary[700]}
            style={{ marginRight: 6 }}
          />
          <Text
            className="font-semibold text-sm"
            style={{ color: activeTab === 'records' ? AppColors.white : AppColors.primary[700] }}
          >
            Prontuários
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'patients' ? (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
          <Text className="text-lg font-bold text-gray-900 mb-2">Visão Geral</Text>
          <StatsGrid
            counts={statsCounts}
            selectedStatus={filterStatus}
            onSelectStatus={setFilterStatus}
          />

          <Text className="text-lg font-bold text-gray-900 mb-2 mt-2">Pacientes em Acompanhamento</Text>
          {isSurgeriesLoading ? (
            <Text className="text-gray-500 text-center py-4">Carregando pacientes...</Text>
          ) : filteredPatients.length === 0 ? (
            <Text className="text-gray-500 text-center py-4">Nenhum paciente neste status</Text>
          ) : (
            filteredPatients.map(patient => (
              <PatientListItem
                key={patient.id}
                name={patient.name}
                surgeryType={patient.surgeryType}
                surgeryDate={patient.surgeryDate}
                day={patient.day}
                status={patient.status}
                lastResponseDate={patient.lastResponseDate}
                alerts={patient.alerts}
                sex={patient.sex}
                onPress={() => handlePatientClick(patient.id)}
              />
            ))
          )}
        </ScrollView>
      ) : (
        <FlatList
          testID="records-list"
          contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
          data={completedRecords}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              {/* Search Input */}
              <View
                className="flex-row items-center rounded-xl px-3 py-2 mb-4"
                style={{ backgroundColor: AppColors.white, borderWidth: 1, borderColor: AppColors.gray[200] }}
              >
                <Search size={18} color={AppColors.gray[400]} style={{ marginRight: 8 }} />
                <TextInput
                  testID="search-records"
                  className="flex-1 text-sm"
                  style={{ color: AppColors.gray[800] }}
                  placeholder="Buscar por nome do paciente..."
                  placeholderTextColor={AppColors.gray[400]}
                  value={searchInput}
                  onChangeText={setSearchInput}
                />
              </View>
              <Text className="text-lg font-bold text-gray-900 mb-2">Prontuários</Text>
            </View>
          }
          ListEmptyComponent={
            isCompletedLoading ? (
              <View className="items-center py-12">
                <ActivityIndicator size="large" color={AppColors.primary[500]} />
                <Text className="text-gray-500 mt-3">Carregando prontuários...</Text>
              </View>
            ) : (
              <View className="items-center py-12">
                <FileText size={48} color={AppColors.gray[300]} />
                <Text className="text-gray-500 font-medium text-base mt-4">
                  Nenhum prontuário disponível
                </Text>
                <Text className="text-gray-400 text-sm mt-1 text-center px-8">
                  {debouncedSearch
                    ? 'Nenhum resultado encontrado para a busca'
                    : 'Pacientes finalizados aparecerão aqui'}
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const dateParts = item.surgery_date.split('T')[0].split('-');
            const surgeryDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
            const completedDate = item.updated_at ? new Date(item.updated_at) : new Date();

            const totalDays = Math.max(0, Math.floor(
              (completedDate.getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24)
            ));

            return (
              <MedicalRecordListItem
                name={item.patient?.full_name || 'Sem nome'}
                surgeryType={item.surgery_type?.name || 'Não especificado'}
                surgeryDate={surgeryDate.toLocaleDateString('pt-BR')}
                completedDate={completedDate.toLocaleDateString('pt-BR')}
                totalDays={totalDays}
                sex={(item.patient as any)?.sex || null}
                onPress={() => handlePatientClick(item.id)}
              />
            );
          }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color={AppColors.primary[500]} />
                <Text className="text-gray-400 text-xs mt-1">Carregando mais...</Text>
              </View>
            ) : null
          }
        />
      )}

      {activeTab === 'patients' && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 w-14 h-14 bg-primary-700 rounded-full items-center justify-center shadow-lg"
          onPress={() => router.push('/doctor/add-patient' as any)}
        >
          <Plus size={30} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

