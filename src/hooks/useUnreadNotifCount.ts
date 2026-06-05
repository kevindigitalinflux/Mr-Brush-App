import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

/** Returns the count of unread notifications for the current user, with realtime updates. */
export function useUnreadNotifCount(): number {
  const { user } = useApp()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) return

    function fetchCount() {
      void supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false)
        .then(({ count: c }) => setCount(c ?? 0))
    }

    fetchCount()

    const channel = supabase
      .channel(`unread-notifs-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, fetchCount)
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [user])

  return count
}
