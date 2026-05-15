// GTC Academy admin notification function.
// Required secrets:
// - EMAIL_PROVIDER=resend|sendgrid|smtp
// - EMAIL_API_KEY
// - EMAIL_FROM
// - ADMIN_EMAIL=contact@generaltechconsult.com

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AdminNotificationEvent =
  | 'new_registration'
  | 'new_login'
  | 'new_purchase'
  | 'course_completed'
  | 'exam_started'
  | 'exam_submitted'
  | 'exam_passed'
  | 'exam_failed'
  | 'certificate_issued'
  | 'trainer_course_submitted'
  | 'admin_approval'
  | 'admin_rejection';

interface NotifyPayload {
  event: AdminNotificationEvent;
  subject?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

async function sendWithResend(payload: NotifyPayload) {
  const apiKey = Deno.env.get('EMAIL_API_KEY');
  const from = Deno.env.get('EMAIL_FROM') ?? 'GTC Academy <contact@generaltechconsult.com>';
  const to = Deno.env.get('ADMIN_EMAIL') ?? 'contact@generaltechconsult.com';
  if (!apiKey) throw new Error('EMAIL_API_KEY is missing');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: payload.subject ?? `[GTC Academy] ${payload.event}`,
      text: `${payload.message}\n\nMetadata:\n${JSON.stringify(payload.metadata ?? {}, null, 2)}`,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const provider = Deno.env.get('EMAIL_PROVIDER') ?? 'resend';
    const payload = await req.json() as NotifyPayload;

    if (!payload.event || !payload.message) {
      return new Response(JSON.stringify({ error: 'event and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (provider !== 'resend') {
      return new Response(JSON.stringify({
        queued: false,
        provider,
        TODO: 'Add sendgrid or smtp adapter when provider is selected.',
      }), {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await sendWithResend(payload);
    return new Response(JSON.stringify({ queued: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
