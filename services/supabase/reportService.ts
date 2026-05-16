
import { supabase } from '../../lib/supabase';
import { DailyReport, IReportService, QuestionWithDetails } from '../types';

export class SupabaseReportService implements IReportService {
  async submitDailyReport(
    patientId: string,
    surgeryId: string,
    answers: Record<string, any>,
    questions: QuestionWithDetails[]
  ): Promise<'critical' | 'warning' | 'stable'> {
    let criticalCount = 0;
    let nonCriticalCount = 0;
    let painLevel = 0;
    let symptoms: string[] = [];
    let alertMessages: string[] = [];

    // 1. Analyze answers against questions rules
    for (const question of questions) {
      const answerValue = answers[question.id];

      // Skip if no answer provided
      if (answerValue === undefined || answerValue === null || answerValue === '') continue;

      const isCritical = question.metadata && (question.metadata as any).category === 'critical';
      let isAbnormal = false;

      // Handle different input types
      if (question.input_type === 'scale') {
        const numericVal = parseInt(answerValue, 10);
        if (!isNaN(numericVal)) {
          if (question.text.toLowerCase().includes('dor')) {
            painLevel = numericVal;
          }
          // Check threshold from metadata (default to > 5 if not specified for pain)
          const abnormalMin = (question.metadata as any).abnormal_min;
          if (abnormalMin !== undefined && numericVal >= abnormalMin) {
            isAbnormal = true;
          } else if (question.text.toLowerCase().includes('dor') && numericVal > 5) {
            isAbnormal = true;
          }
        }
      } else if (question.input_type === 'boolean' || question.input_type === 'select') {
        // Find selected option
        const selectedOption = question.options?.find(opt => opt.value === String(answerValue));
        if (selectedOption) {
          const isAbnormalOption = String(selectedOption.is_abnormal) === 'true';
          if (isAbnormalOption === true) {
            isAbnormal = true;
            symptoms.push(question.text); // Add question text to symptoms list
            alertMessages.push(`${question.text}: ${selectedOption.label}`);
          }
        }
      } else if (question.input_type === 'multiselect') {
        // Handle array of values
        if (Array.isArray(answerValue)) {
          for (const val of answerValue) {
            const option = question.options?.find(opt => opt.value === String(val));
            const isAbnormalOption = option ? String(option.is_abnormal) === 'true' : false;
            if (isAbnormalOption === true && option) {
              isAbnormal = true; // Mark question as having abnormal answer
              symptoms.push(`${question.text} (${option.label})`);
              alertMessages.push(`${question.text}: ${option.label}`);
            }
          }
        }
      } else if (question.input_type === 'numeric') {
        // Handle numeric values (e.g., drain volume)
        const meta = question.metadata as any;
        const abnormalMin = meta?.abnormal_min;
        const aboveMaxValue = meta?.above_max_value;
        const unit = meta?.unit ?? '';

        if (aboveMaxValue && String(answerValue) === String(aboveMaxValue)) {
          // Above max is always abnormal
          isAbnormal = true;
          symptoms.push(question.text);
          alertMessages.push(`${question.text}: ${aboveMaxValue}${unit ? ' ' + unit : ''}`);
        } else {
          const numericVal = parseInt(answerValue, 10);
          if (!isNaN(numericVal) && abnormalMin !== undefined && numericVal >= abnormalMin) {
            isAbnormal = true;
            symptoms.push(question.text);
            alertMessages.push(`${question.text}: ${numericVal}${unit ? ' ' + unit : ''}`);
          }
        }
      }

      if (isAbnormal) {
        if (isCritical) {
          criticalCount++;
        } else {
          nonCriticalCount++;
        }
      }
    }

    // 2. Determine Alert Severity
    let alertSeverity: 'critical' | 'warning' | null = null;
    let alertReason = '';

    if (criticalCount >= 3) {
      alertSeverity = 'critical';
      alertReason = '3 ou mais sinais críticos detectados.';
    } else if (nonCriticalCount >= 5) {
      alertSeverity = 'critical';
      alertReason = '5 ou mais sinais de alerta detectados.';
    } else if (nonCriticalCount >= 3) {
      alertSeverity = 'warning';
      alertReason = '3 a 4 sinais de alerta detectados.';
    }

    // 3. Insert Daily Report
    // Create local YYYY-MM-DD string to avoid UTC timezone issues
    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];

    const { error: reportError } = await supabase.from('daily_reports').insert({
      surgery_id: surgeryId,
      date: localDate,
      pain_level: painLevel,
      symptoms: symptoms.length > 0 ? symptoms : null, // Store list of symptoms as JSON
      answers: answers // Store raw answers
    });

    if (reportError) {
      console.error('Error creating daily report:', reportError);
      throw reportError;
    }

    // 4. Create Alert if needed
    if (alertSeverity) {
      const { error: alertError } = await supabase.from('alerts').insert({
        surgery_id: surgeryId,
        severity: alertSeverity,
        message: `${alertReason} Detalhes: ${alertMessages.join(', ')}`,
        is_resolved: false
      });

      if (alertError) {
        console.error('Error creating alert:', alertError);
        // Don't throw here, as the report was already saved. just log it.
      }
    }

    // 5. Update Surgery Medical Status
    const newStatus = alertSeverity === 'critical' ? 'critical'
      : alertSeverity === 'warning' ? 'warning'
        : 'stable';

    const { error: updateSurgeryError } = await supabase
      .from('surgeries')
      .update({
        medical_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', surgeryId);

    if (updateSurgeryError) {
      console.error('Error updating surgery status:', updateSurgeryError);
    }

    return newStatus;
  }

  async getPatientReports(patientId: string): Promise<DailyReport[]> {
    // Fetch reports
    // Fetch surgeries for the patient to get their IDs
    const { data: surgeries, error: surgeriesError } = await supabase
      .from('surgeries')
      .select('id')
      .eq('patient_id', patientId);

    if (surgeriesError) {
      console.error('Error fetching surgeries:', surgeriesError);
      throw surgeriesError;
    }

    const surgeryIds = surgeries?.map(s => s.id) || [];

    if (surgeryIds.length === 0) return [];

    // Fetch reports for these surgeries
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('*')
      .in('surgery_id', surgeryIds)
      .order('date', { ascending: false });

    let alerts: { severity: string, message: string, created_at: string }[] = [];

    if (surgeryIds.length > 0) {
      const { data: fetchedAlerts, error: alertsError } = await supabase
        .from('alerts')
        .select('severity, message, created_at')
        .in('surgery_id', surgeryIds);

      if (alertsError) {
        console.error('Error fetching alerts:', alertsError);
      } else {
        alerts = (fetchedAlerts || [])
          .filter(a => a.severity && a.message && a.created_at)
          .map(a => ({
            severity: a.severity!,
            message: a.message!,
            created_at: a.created_at!
          }));
      }
    }

    // ... rest of getPatientReports

    return (reports || []).map(report => {
      if (!report.date) return report as DailyReport;
      const reportDateStr = String(report.date).substring(0, 10);
      const matchingAlerts = alerts?.filter(alert => {
        if (!alert.created_at) return false;
        const alertDate = new Date(alert.created_at).toISOString().split('T')[0];
        return alertDate === reportDateStr;
      }).map(a => ({ severity: a.severity as 'critical' | 'warning', message: a.message })) || [];
      return {
        ...report,
        alerts: matchingAlerts.length > 0 ? matchingAlerts : undefined
      } as DailyReport;
    });
  }

  async getReportsBySurgeryId(surgeryId: string): Promise<DailyReport[]> {
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('surgery_id', surgeryId)
      .order('date', { ascending: false });

    let alerts: { severity: string, message: string, created_at: string }[] = [];

    const { data: fetchedAlerts, error: alertsError } = await supabase
      .from('alerts')
      .select('severity, message, created_at')
      .eq('surgery_id', surgeryId);

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
    } else {
      alerts = (fetchedAlerts || [])
        .filter(a => a.severity && a.message && a.created_at)
        .map(a => ({
          severity: a.severity!,
          message: a.message!,
          created_at: a.created_at!
        }));
    }

    return (reports || []).map(report => {
      if (!report.date) return report as DailyReport;
      const reportDateStr = String(report.date).substring(0, 10);

      const matchingAlerts = alerts?.filter(alert => {
        if (!alert.created_at) return false;
        const alertDate = new Date(alert.created_at).toISOString().split('T')[0];
        return alertDate === reportDateStr;
      }).map(a => ({ severity: a.severity as 'critical' | 'warning', message: a.message })) || [];

      return {
        ...report,
        alerts: matchingAlerts.length > 0 ? matchingAlerts : undefined
      } as DailyReport;
    });
  }

  async getReportById(reportId: string): Promise<DailyReport | null> {
    const { data: report, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) {
      console.error('Error fetching report:', error);
      return null;
    }

    // Fetch alerts for this report's date
    if (!report.date) return report as DailyReport;
    const reportDate = new Date(report.date).toISOString().split('T')[0];

    if (!report.surgery_id) return report as DailyReport;

    const { data: alerts } = await supabase
      .from('alerts')
      .select('severity, message, created_at')
      .eq('surgery_id', report.surgery_id);

    const matchingAlerts = (alerts || [])
      .filter(a => a.severity && a.message && a.created_at)
      .filter(a => {
        const alertDate = new Date(a.created_at!).toISOString().split('T')[0];
        return alertDate === reportDate;
      })
      .map(a => ({
        severity: a.severity as 'critical' | 'warning',
        message: a.message!
      }));

    return {
      ...report,
      alerts: matchingAlerts
    } as DailyReport;
  }
}

export const reportService = new SupabaseReportService();
