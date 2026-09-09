import { useEffect } from 'react';
import { supabase } from './supabase';

// Subscribes to live changes on this company's jobs (via Supabase Realtime) so
// every open tab/session reflects new or updated jobs immediately — no refresh.
export function useRealtimeJobs(companyId, onChange) {
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel(`jobs-realtime-${companyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs', filter: `company_id=eq.${companyId}` },
        onChange
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);
}
