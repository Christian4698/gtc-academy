import { supabase, isSupabaseConfigured } from './supabase';
import {
  AdminKpis,
  ApiResponse,
  DeliveryMode,
  LegalDocument,
  PaymentStatus,
  Purchase,
  SupportTicket,
  UserRole,
} from '../types';
import { GTC_WEBSITE_URL } from '../config/production';

const roleRank: Record<UserRole, number> = {
  student: 1,
  instructor: 2,
  admin: 3,
  super_admin: 4,
};

function apiError(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error && 'message' in error) return String((error as { message: unknown }).message);
  return 'Unexpected error';
}

export const PermissionService = {
  hasAtLeast(role: UserRole | undefined, minimum: UserRole) {
    return roleRank[role ?? 'student'] >= roleRank[minimum];
  },

  canCreateAdmin(role: UserRole | undefined) {
    return role === 'super_admin';
  },

  canRevokeCertificate(role: UserRole | undefined) {
    return role === 'super_admin';
  },

  canViewFinancialReports(role: UserRole | undefined) {
    return role === 'super_admin';
  },

  canManageCourses(role: UserRole | undefined) {
    return role === 'super_admin' || role === 'admin' || role === 'instructor';
  },
};

export const AuditService = {
  async log(userId: string | null, action: string, metadata: Record<string, unknown> = {}) {
    if (!isSupabaseConfigured || !userId) return { error: null };
    const { error } = await supabase.from('audit_logs').insert({
      actor_id: userId,
      action,
      metadata,
    });
    return { error: apiError(error) };
  },
};

export const LegalService = {
  fallbackDocuments(language: 'fr' | 'en' = 'fr'): LegalDocument[] {
    const fr = language === 'fr';
    return [
      {
        slug: 'terms',
        title: fr ? 'Conditions generales' : 'Terms and Conditions',
        language,
        version: '1.0',
        body: fr
          ? 'GTC Academy fournit des formations technologiques. Les utilisateurs doivent respecter les regles de compte, de paiement, de contenu et de certification. Les acces payants sont debloques apres paiement valide.'
          : 'GTC Academy provides technology training. Users must respect account, payment, content, and certification rules. Paid access is unlocked after successful payment.',
      },
      {
        slug: 'privacy',
        title: fr ? 'Politique de confidentialite' : 'Privacy Policy',
        language,
        version: '1.0',
        body: fr
          ? 'Les donnees de profil, progression, achat, examens et certificats sont stockees dans Supabase comme source de verite. Le stockage local sert uniquement au cache et au mode hors ligne.'
          : 'Profile, progress, purchase, exam, and certificate data are stored in Supabase as the source of truth. Local storage is used only for cache and offline mode.',
      },
      {
        slug: 'refund',
        title: fr ? 'Politique de remboursement' : 'Refund Policy',
        language,
        version: '1.0',
        body: fr
          ? 'Les demandes de remboursement sont etudiees par GTC selon le statut du paiement, l acces consomme et les conditions commerciales applicables.'
          : 'Refund requests are reviewed by GTC according to payment status, consumed access, and applicable commercial terms.',
      },
      {
        slug: 'certificate_disclaimer',
        title: fr ? 'Disclaimer certificats' : 'Certificate Disclaimer',
        language,
        version: '1.0',
        body: fr
          ? 'Les certificats portent la mention "GTC Verifiable Certificate" et "Certificate issued by General Tech Consult". Aucune accreditation internationale n est revendiquee par defaut.'
          : 'Certificates use the wording "GTC Verifiable Certificate" and "Certificate issued by General Tech Consult". International accreditation is not claimed by default.',
      },
    ];
  },

  async list(language: 'fr' | 'en' = 'fr'): Promise<ApiResponse<LegalDocument[]>> {
    if (!isSupabaseConfigured) {
      return { data: this.fallbackDocuments(language), error: null };
    }
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('language', language)
      .eq('active', true)
      .order('published_at', { ascending: false });
    return { data: (data as LegalDocument[]) ?? this.fallbackDocuments(language), error: apiError(error) };
  },

  async recordConsent(userId: string, documentSlug: LegalDocument['slug'], version = '1.0') {
    if (!isSupabaseConfigured) return { error: null };
    const { error } = await supabase.from('user_consents').insert({
      user_id: userId,
      document_slug: documentSlug,
      version,
      accepted: true,
    });
    return { error: apiError(error) };
  },

  async requestDataDeletion(userId: string, reason?: string) {
    if (!isSupabaseConfigured) return { data: true, error: null };
    const { data, error } = await supabase.from('data_deletion_requests').insert({
      user_id: userId,
      request_type: 'data_deletion',
      reason,
    }).select().single();
    return { data, error: apiError(error) };
  },

  async requestAccountDeletion(userId: string, reason?: string) {
    if (!isSupabaseConfigured) return { data: true, error: null };
    const { data, error } = await supabase.from('data_deletion_requests').insert({
      user_id: userId,
      request_type: 'account_deletion',
      reason,
    }).select().single();
    return { data, error: apiError(error) };
  },
};

export const PurchaseService = {
  async createPendingPurchase(input: {
    userId: string;
    courseId: string;
    amount: number;
    currency?: string;
    provider?: Purchase['provider'];
    trainingOption?: DeliveryMode;
    couponId?: string | null;
  }): Promise<ApiResponse<Purchase>> {
    if (!isSupabaseConfigured) {
      return {
        data: {
          id: `demo-purchase-${Date.now()}`,
          user_id: input.userId,
          course_id: input.courseId,
          provider: input.provider ?? 'manual',
          provider_reference: null,
          currency: input.currency ?? 'USD',
          amount: input.amount,
          discount_amount: 0,
          total_amount: input.amount,
          payment_status: 'pending',
          training_option: input.trainingOption ?? 'online',
          coupon_id: input.couponId ?? null,
          paid_at: null,
          refunded_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    const { data, error } = await supabase.from('purchases').insert({
      user_id: input.userId,
      course_id: input.courseId,
      amount: input.amount,
      total_amount: input.amount,
      currency: input.currency ?? 'USD',
      provider: input.provider ?? 'manual',
      training_option: input.trainingOption ?? 'online',
      coupon_id: input.couponId ?? null,
      payment_status: 'pending' satisfies PaymentStatus,
    }).select().single();
    return { data: data as Purchase | null, error: apiError(error) };
  },

  async canAccessCourse(userId: string, courseId: string) {
    if (!isSupabaseConfigured) return true;
    const { data, error } = await supabase.rpc('can_access_course', { target_course_id: courseId });
    await AuditService.log(userId, 'course_access_check', { courseId, allowed: Boolean(data) });
    return error ? false : Boolean(data);
  },
};

export const SupportService = {
  async createTicket(userId: string, subject: string, body: string): Promise<ApiResponse<SupportTicket>> {
    if (!isSupabaseConfigured) {
      return {
        data: {
          id: `demo-ticket-${Date.now()}`,
          user_id: userId,
          subject,
          body,
          status: 'open',
          priority: 'normal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    }
    const { data, error } = await supabase.from('support_tickets').insert({
      user_id: userId,
      subject,
      body,
      status: 'open',
      priority: 'normal',
    }).select().single();
    return { data: data as SupportTicket | null, error: apiError(error) };
  },

  async listForUser(userId: string): Promise<ApiResponse<SupportTicket[]>> {
    if (!isSupabaseConfigured) return { data: [], error: null };
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data: (data as SupportTicket[]) ?? [], error: apiError(error) };
  },
};

export const ContentSecurityService = {
  async createSignedResourceUrl(bucket: string, path: string, expiresInSeconds = 600) {
    if (!isSupabaseConfigured) return { data: path, error: null };
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
    return { data: data?.signedUrl ?? null, error: apiError(error) };
  },

  publicCertificateUrl(certificateId: string) {
    return `${GTC_WEBSITE_URL}/certificates/verify/${encodeURIComponent(certificateId)}`;
  },
};

export const ExamAuditService = {
  async logEvent(userId: string, quizId: string, eventType: string, payload: Record<string, unknown> = {}, attemptId?: string) {
    if (!isSupabaseConfigured) return { error: null };
    const { error } = await supabase.from('exam_attempt_events').insert({
      attempt_id: attemptId,
      user_id: userId,
      quiz_id: quizId,
      event_type: eventType,
      payload,
    });
    return { error: apiError(error) };
  },
};

export const AdminProductionService = {
  async getKpis(): Promise<ApiResponse<AdminKpis>> {
    if (!isSupabaseConfigured) {
      return {
        data: {
          total_users: 1,
          active_students: 1,
          paid_students: 0,
          revenue: 0,
          valid_certificates: 1,
          passed_exams: 0,
          submitted_exams: 0,
        },
        error: null,
      };
    }
    const { data, error } = await supabase.from('admin_kpis').select('*').single();
    return { data: data as AdminKpis | null, error: apiError(error) };
  },

  async revokeCertificate(role: UserRole | undefined, certificateId: string, reason: string) {
    if (!PermissionService.canRevokeCertificate(role)) {
      return { error: 'Only super_admin can revoke certificates.' };
    }
    if (!isSupabaseConfigured) return { error: null };
    const { error } = await supabase
      .from('certificates')
      .update({
        verification_status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoke_reason: reason,
      })
      .eq('id', certificateId);
    return { error: apiError(error) };
  },
};

export const AdminNotificationService = {
  async notifyAdmin(event: string, message: string, metadata: Record<string, unknown> = {}) {
    if (!isSupabaseConfigured) return { error: null };
    const { error } = await supabase.functions.invoke('notify-admin', {
      body: {
        event,
        message,
        metadata,
      },
    });
    return { error: apiError(error) };
  },
};
