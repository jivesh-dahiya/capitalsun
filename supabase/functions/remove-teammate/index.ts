// Removes a teammate from the CALLING user's own company. Only an owner or
// admin can do this, and the owner account itself can never be removed this
// way (there's no ownership-transfer flow yet, so that stays a manual/
// support action rather than something exploitable here).
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

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'Not signed in' }, 401);

  const { data: callerProfile, error: profileLookupError } = await callerClient
    .from('profiles')
    .select('company_id, role')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (profileLookupError || !callerProfile?.company_id) {
    return json({ error: "Couldn't find a company for your account" }, 400);
  }
  if (!['owner', 'admin'].includes(callerProfile.role)) {
    return json({ error: 'Only an owner or admin can remove teammates' }, 403);
  }

  let body: { userId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }
  const userId = body.userId?.trim();
  if (!userId) return json({ error: 'userId is required' }, 400);

  // Elevated client — service-role key never reaches the browser.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: targetProfile, error: targetLookupError } = await adminClient
    .from('profiles')
    .select('company_id, role')
    .eq('id', userId)
    .maybeSingle();
  if (targetLookupError || !targetProfile) return json({ error: 'Teammate not found' }, 404);
  if (targetProfile.company_id !== callerProfile.company_id) {
    return json({ error: "That account isn't part of your company" }, 403);
  }
  if (targetProfile.role === 'owner') {
    return json({ error: "The owner account can't be removed" }, 400);
  }

  // Deleting the auth user cascades to their profiles row (profiles.id
  // references auth.users.id on delete cascade).
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteError) return json({ error: deleteError.message }, 400);

  return json({ success: true });
});
