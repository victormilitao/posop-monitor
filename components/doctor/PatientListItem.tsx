import { CheckCircle, ChevronRight, Clock, User } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export type PatientStatus = 'critical' | 'warning' | 'stable' | 'finished' | 'pending_return';

interface PatientListItemProps {
    name: string;
    surgeryType?: string;
    surgeryDate: string;
    day: number;
    status: PatientStatus;
    lastResponseDate: string | null;
    alerts?: string[];
    sex?: string | null;
    onPress: () => void;
}

export function PatientListItem({
    name,
    surgeryType,
    surgeryDate,
    day,
    status,
    lastResponseDate,
    alerts = [],
    sex,
    onPress
}: PatientListItemProps) {

    let statusColor = '#22c55e'; // green
    let statusLabel = 'Estável';
    let badgeVariant: 'default' | 'critical' | 'warning' | 'success' = 'default';

    if (status === 'critical') {
        statusColor = '#ef4444'; // red
        statusLabel = 'Crítico';
        badgeVariant = 'critical';
    } else if (status === 'warning') {
        statusColor = '#eab308'; // yellow
        statusLabel = 'Atenção';
        badgeVariant = 'warning';
    } else if (status === 'pending_return') {
        statusColor = '#f97316'; // orange
        statusLabel = 'Pendente Retorno';
        badgeVariant = 'default';
    } else if (status === 'finished') {
        statusColor = '#3b82f6'; // blue
        statusLabel = 'Finalizado';
        badgeVariant = 'success';
    } else {
        badgeVariant = 'success'; // stable is green
    }

    return (
        <TouchableOpacity onPress={onPress}>
            <Card className="mb-3 border-l-4" style={{ borderLeftColor: statusColor }}>
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-row items-center flex-1">
                        <User
                            size={20}
                            color={sex === 'F' ? '#EC4899' : '#3B82F6'}
                            style={{ marginRight: 6 }}
                        />
                        <View className="flex-1">
                            <Text className="text-gray-900 font-bold text-lg">{name}</Text>
                            {surgeryType ? (
                                <>
                                    <Text className="text-gray-500 text-sm" numberOfLines={1}><Text className="font-bold">Cirurgia:</Text> {surgeryType}</Text>
                                    <Text className="text-gray-500 text-sm"><Text className="font-bold">Data da Cirurgia:</Text> {surgeryDate}</Text>
                                </>
                            ) : (
                                <Text className="text-gray-500 text-sm"><Text className="font-bold">Data da Cirurgia:</Text> {surgeryDate}</Text>
                            )}
                        </View>
                    </View>
                    <Badge label={`Dia ${day}`} variant="default" />
                </View>

                {alerts.length > 0 && (
                    <View className="bg-red-50 p-2 rounded-lg mb-2">
                        {alerts.map((alert, index) => (
                            <Text key={index} className="text-red-700 text-xs flex-row items-center">
                                • {alert}
                            </Text>
                        ))}
                    </View>
                )}

                {status !== 'finished' && (
                    <View className="flex-row justify-between items-center mt-1">
                        {status === 'pending_return' ? (
                            <View className="flex-row items-center">
                                <Clock size={14} color="#f97316" style={{ marginRight: 4 }} />
                                <Text className="text-orange-600 font-medium text-sm">Pendente Retorno</Text>
                            </View>
                        ) : lastResponseDate ? (
                            <View className="flex-row items-center">
                                <View className={`w-2 h-2 rounded-full mr-2`} style={{ backgroundColor: statusColor }} />
                                <Text className="text-gray-600 text-sm">{statusLabel}</Text>
                            </View>
                        ) : (
                            <View />
                        )}
                        <View className="flex-row items-center">
                            <Text className="text-gray-400 text-xs mr-2">
                                {lastResponseDate
                                    ? `Última resposta em ${new Date(lastResponseDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
                                    : 'Sem respostas'}
                            </Text>
                            <ChevronRight size={16} color="#9ca3af" />
                        </View>
                    </View>
                )}
            </Card>
        </TouchableOpacity>
    );
}
