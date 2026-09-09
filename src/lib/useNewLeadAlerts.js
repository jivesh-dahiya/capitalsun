import { useEffect, useState } from 'react';
import { supabase } from './supabase';

const AUTOMATED_CHANNELS = new Set(['website_chat', 'api']);

// Live "a lead just came in automatically" alert (chat widget or the
// external website-form API), so a salesperson sees it the moment it
// happens instead of finding it in the morning.
export function useNewLeadAlerts(companyId) {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel(`lead-alerts-${companyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads', filter: `company_id=eq.${companyId}` },
        (payload) => {
          if (AUTOMATED_CHANNELS.has(payload.new.channel)) setToast(payload.new);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [companyId]);

  return [toast, setToast];
}
