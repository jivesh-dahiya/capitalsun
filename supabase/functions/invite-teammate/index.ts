// Invites a new teammate into the CALLING user's own company. Public sign-up
// is disabled in production, so this is how an existing account holder adds
// staff — it needs the service-role key to create the auth user, which is
// why this runs as an Edge Function rather than a direct client call.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Scoped to the caller's own session — used only to find out who they are.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'Not signed in' }, 401);

  const { data: callerProfile, error: profileLookupError } = await callerClient
    .from('profiles')
    .select('company_id')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (profileLookupError || !callerProfile?.company_id) {
    return json({ error: "Couldn't find a company for your account" }, 400);
  }

  let body: { email?: string; firstName?: string; lastName?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }
  const email = body.email?.trim();
  if (!email) return json({ error: 'Email is required' }, 400);

  // Elevated client — service-role key never reaches the browser.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const siteUrl = Deno.env.get('SITE_URL');

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: siteUrl ? `${siteUrl}/reset-password` : undefined,
  });
  if (inviteError) return json({ error: inviteError.message }, 400);

  const { error: insertError } = await adminClient.from('profiles').insert({
    id: invited.user.id,
    company_id: callerProfile.company_id,
    first_name: body.firstName || null,
    last_name: body.lastName || null,
  });
  if (insertError) {
    // Roll back the auth user so a failed invite doesn't leave an orphaned account.
    await adminClient.auth.admin.deleteUser(invited.user.id);
    return json({ error: insertError.message }, 400);
  }

  return json({ success: true, userId: invited.user.id });
});
