// ============================================================
//  GTC ACADEMY — Edge Function: generate-certificate
//  POST /functions/v1/generate-certificate
//  Body: { user_id, course_id }
//  Returns: { cert_id, pdf_url, qr_url }
// ============================================================
import { serve }         from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient }  from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { user_id, course_id } = await req.json();
    if (!user_id || !course_id) {
      return new Response(JSON.stringify({ error: 'user_id and course_id required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Verify course is 100% complete
    const { data: progress } = await supabase.rpc('get_course_progress', {
      p_user_id: user_id, p_course_id: course_id,
    });
    if ((progress ?? 0) < 100) {
      return new Response(JSON.stringify({ error: 'Course not yet completed' }), {
        status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user + course data
    const [profileRes, courseRes] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user_id).single(),
      supabase.from('courses').select('title').eq('id', course_id).single(),
    ]);

    const fullName   = profileRes.data?.full_name ?? 'Unknown';
    const courseTitle = courseRes.data?.title      ?? 'Unknown Course';

    // Generate cert ID
    const year   = new Date().getFullYear();
    const prefix = courseTitle.toLowerCase().includes('excel')     ? 'XL' :
                   courseTitle.toLowerCase().includes('data')      ? 'DA' :
                   courseTitle.toLowerCase().includes('dashboard')  ? 'DB' :
                   courseTitle.toLowerCase().includes('sheets')    ? 'GS' : 'TC';
    const seq    = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    const certId = `GTC-${year}-${prefix}-${seq}`;

    // Build QR code URL (points to public verification page)
    const baseUrl = Deno.env.get('APP_PUBLIC_URL') ?? 'https://gtcacademy.com';
    const verifyUrl = `${baseUrl}/verify/${certId}`;

    // Generate certificate HTML → PDF via html-pdf-node equivalent
    const certDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 842px; height: 595px;
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #F0F4FF 0%, #E8EFFF 100%);
      display: flex; flex-direction: column;
      border: 8px solid #0A3EFF;
    }
    .header {
      background: linear-gradient(135deg, #0A3EFF, #00C8FF);
      padding: 20px 32px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .logo { color: white; }
    .logo-name { font-size: 22px; font-weight: 800; letter-spacing: 2px; }
    .logo-tag  { font-size: 11px; opacity: .7; letter-spacing: 1px; }
    .emoji { font-size: 36px; }
    .body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; }
    .label {
      font-size: 11px; font-weight: 700; letter-spacing: 4px;
      color: #4466AA; text-transform: uppercase; margin-bottom: 16px;
    }
    .divider { width: 60px; height: 3px; background: linear-gradient(90deg, transparent, #0A3EFF, transparent); margin: 0 auto 20px; }
    .sub { font-size: 14px; color: #8899BB; margin-bottom: 8px; }
    .name { font-family: 'Playfair Display', serif; font-size: 42px; color: #1A1A4E; margin-bottom: 8px; }
    .course-label { font-size: 13px; color: #8899BB; margin-bottom: 6px; }
    .course { font-size: 22px; font-weight: 800; color: #0A3EFF; margin-bottom: 4px; }
    .date { font-size: 12px; color: #8899BB; }
    .footer {
      display: flex; justify-content: space-between; align-items: flex-end;
      padding: 20px 32px; border-top: 1px solid rgba(10,62,255,.15);
    }
    .sig-line { width: 140px; height: 1px; background: #333; margin-bottom: 6px; }
    .sig-name { font-size: 12px; color: #444; font-weight: 600; }
    .sig-role { font-size: 10px; color: #888; margin-top: 2px; }
    .cert-id   { font-size: 10px; color: #AABBCC; margin-top: 8px; font-family: monospace; }
    .qr-wrap { text-align: center; }
    .qr-label { font-size: 9px; color: #8899BB; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div class="logo-name">GTC ACADEMY</div>
      <div class="logo-tag">"Data Speaks. Experts Decide."</div>
    </div>
    <div class="emoji">🎓</div>
  </div>

  <div class="body">
    <div class="label">Certificate of Completion</div>
    <div class="divider"></div>
    <div class="sub">This is to certify that</div>
    <div class="name">${fullName}</div>
    <div class="course-label">has successfully completed</div>
    <div class="course">${courseTitle}</div>
    <div class="date">Issued on ${certDate}</div>
  </div>

  <div class="footer">
    <div>
      <div class="sig-line"></div>
      <div class="sig-name">GTC Director</div>
      <div class="sig-role">General Tech Consult Ltd.</div>
      <div class="cert-id">${certId}</div>
    </div>
    <div class="qr-wrap">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verifyUrl)}" width="80" height="80" />
      <div class="qr-label">Scan to verify</div>
    </div>
  </div>
</body>
</html>`;

    // Convert HTML to PDF using Puppeteer (available in Deno Deploy)
    // Note: In production use a PDF service like Gotenberg or html-pdf-node via a sidecar
    const pdfResponse = await fetch('https://gotenberg.your-domain.com/forms/chromium/convert/html', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: createFormData(html),
    }).catch(() => null);

    let pdfUrl: string | null = null;

    if (pdfResponse?.ok) {
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const fileName  = `certificates/${certId}.pdf`;
      const { error: uploadErr } = await supabase.storage
        .from('certificates')
        .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true });

      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from('certificates').getPublicUrl(fileName);
        pdfUrl = publicUrl;
      }
    }

    // Save certificate record to DB
    const { data: cert, error: certErr } = await supabase
      .from('certificates')
      .upsert({
        user_id:    user_id,
        course_id:  course_id,
        cert_id:    certId,
        pdf_url:    pdfUrl,
        qr_url:     `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}`,
        status:     'issued',
        issued_at:  new Date().toISOString(),
      }, { onConflict: 'user_id,course_id' })
      .select()
      .single();

    if (certErr) throw certErr;

    // Mark course enrollment as completed
    await supabase.from('enrollments')
      .update({ completed_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .eq('course_id', course_id);

    // Send congratulations notification
    await supabase.from('notifications').insert({
      user_id,
      type:  'certificate',
      title: '🏆 Certificate Earned!',
      body:  `Congratulations! Your ${courseTitle} certificate is ready.`,
      deep_link: `gtcacademy://certificate/${certId}`,
    });

    return new Response(
      JSON.stringify({ cert_id: certId, pdf_url: pdfUrl, qr_url: cert.qr_url }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('generate-certificate error:', err);
    return new Response(
      JSON.stringify({ error: err.message ?? 'Internal server error' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});

function createFormData(html: string): FormData {
  const form = new FormData();
  const blob = new Blob([html], { type: 'text/html' });
  form.append('files', blob, 'index.html');
  return form;
}
