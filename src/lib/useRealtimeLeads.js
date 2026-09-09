import { useEffect } from 'react';
import { supabase } from './supabase';

// Subscribes to live changes on this company's leads, same pattern as
// useRealtimeJobs — so a lead created by the chat widget shows up in the
// pipeline immediately, not just via the toast.
export function useRealtimeLeads(companyId, onChange) {
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel(`leads-realtime-${companyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `company_id=eq.${companyId}` },
        onChange
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);
}
