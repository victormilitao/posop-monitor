import { useQueryClient } from '@tanstack/react-query';
import { Redirect, Stack, useRouter } from 'expo-router';
import { LogOut, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PatientListItem, PatientStatus } from '../../components/doctor/PatientListItem';
import { StatsGrid } from '../../components/doctor/StatsGrid';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useAutoFinalizeSurgeries, useSurgeriesByDoctor } from '../../hooks/useSurgeries';

interface Patient {
  id: string;
  name: string;
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
  const insets = useSafeAreaInsets();

  // Use React Query hook for surgeries
  const { data: surgeriesData, isLoading: isSurgeriesLoading } = useSurgeriesByDoctor(profile?.id);

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

      if (surgery.status === 'completed' || daysSinceSurgery >= 15) {
        patientStatus = 'finished';
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

  // Filter patients based on selection
  const filteredPatients = useMemo(() => {
    return patients.filter(p => p.status === filterStatus);
  }, [patients, filterStatus]);

  // Calculate counts for StatsGrid
  const statsCounts = useMemo(() => {
    const counts = {
      critical: 0,
      warning: 0,
      stable: 0,
      finished: 0
    };
    patients.forEach(p => {
      if (p.status === 'critical') counts.critical++;
      else if (p.status === 'warning') counts.warning++;
      else if (p.status === 'stable') counts.stable++;
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

  if (isAuthLoading) return <View className="flex-1 justify-center items-center"><Text>Carregando...</Text></View>;
  if (!session || !isDoctor) return <Redirect href="/" />;

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        className="bg-primary-700 px-6 pb-6 rounded-b-3xl mb-4"
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

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary-700 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push('/doctor/add-patient' as any)}
      >
        <Plus size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}
