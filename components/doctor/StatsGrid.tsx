import { Text, TouchableOpacity, View } from 'react-native';

export type StatStatus = 'critical' | 'warning' | 'stable' | 'finished';

interface StatCardProps {
    label: string;
    count: number;
    color: 'red' | 'yellow' | 'green' | 'gray';
    isSelected: boolean;
    onPress: () => void;
}

function StatCard({ label, count, color, isSelected, onPress }: StatCardProps) {
    let borderColor = 'border-gray-300';
    let textColor = 'text-gray-900';
    let countColor = 'text-gray-900';

    if (color === 'red') {
        borderColor = 'border-red-500';
        textColor = 'text-red-700';
        countColor = 'text-red-600';
    } else if (color === 'yellow') {
        borderColor = 'border-yellow-500';
        textColor = 'text-yellow-700';
        countColor = 'text-yellow-600';
    } else if (color === 'green') {
        borderColor = 'border-green-500';
        textColor = 'text-green-700';
        countColor = 'text-green-600';
    } else if (color === 'gray') {
        borderColor = 'border-gray-400';
        textColor = 'text-gray-700';
        countColor = 'text-gray-600';
    }

    return (
        <TouchableOpacity onPress={onPress} className="flex-1 mx-1" activeOpacity={0.7}>
            <View
                className={`items-center justify-center rounded-xl p-3 shadow-sm bg-white border-2 ${isSelected ? borderColor : 'border-gray-100'}`}
            >
                <Text className={`text-2xl font-bold ${countColor}`}>{count}</Text>
                <Text className={`text-xs font-medium ${textColor} text-center`} numberOfLines={1}>{label}</Text>
            </View>
        </TouchableOpacity>
    );
}

interface StatsGridProps {
    counts?: {
        critical: number;
        warning: number;
        stable: number;
        finished: number;
    };
    selectedStatus?: StatStatus;
    onSelectStatus?: (status: StatStatus) => void;
}

export function StatsGrid({ counts, selectedStatus, onSelectStatus }: StatsGridProps) {
    const handleSelect = (status: StatStatus) => {
        if (onSelectStatus) onSelectStatus(status);
    };

    return (
        <View className="flex-row justify-between mb-6">
            <StatCard
                label="Crítico"
                count={counts?.critical || 0}
                color="red"
                isSelected={selectedStatus === 'critical'}
                onPress={() => handleSelect('critical')}
            />
            <StatCard
                label="Atenção"
                count={counts?.warning || 0}
                color="yellow"
                isSelected={selectedStatus === 'warning'}
                onPress={() => handleSelect('warning')}
            />
            <StatCard
                label="Esperado"
                count={counts?.stable || 0}
                color="green"
                isSelected={selectedStatus === 'stable'}
                onPress={() => handleSelect('stable')}
            />
            <StatCard
                label="Finalizados"
                count={counts?.finished || 0}
                color="gray"
                isSelected={selectedStatus === 'finished'}
                onPress={() => handleSelect('finished')}
            />
        </View>
    );
}
