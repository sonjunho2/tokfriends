// services/api/src/modules/analytics/analytics.service.ts

// 두 형태 모두 지원:
// 1) logEvent('event_name', {props}, userId)
// 2) logEvent(userId, 'event_name', {props})

export function logEvent(
  event: string,
  props?: Record<string, any>,
  userId?: string | null
): Promise<void>;
export function logEvent(
  userId: string | null,
  event: string,
  props?: Record<string, any>
): Promise<void>;

export async function logEvent(a: any, b: any = {}, c: any = null): Promise<void> {
  let event: string;
  let props: Record<string, any> = {};
  let userId: string | null = null;

  if (typeof a === 'string') {
    // 형태 1) event 먼저
    event = a;
    props = (b && typeof b === 'object') ? b : {};
    userId = (typeof c === 'string' || c === null) ? c : null;
  } else {
    // 형태 2) userId 먼저
    userId = a ?? null;
    event = typeof b === 'string' ? b : 'unknown_event';
    props = (c && typeof c === 'object') ? c : {};
  }

  try {
    console.log('[analytics]', { event, userId, ...props });
  } catch {
    /* noop */
  }
}
