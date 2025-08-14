type EventProps = Record<string, any>;

export function logEvent(name: string, props?: EventProps) {
  // MVP stub: console log only. Replace with real telemetry in E12.
  // Ensure no sensitive data is logged.
  // eslint-disable-next-line no-console
  console.log(`[telemetry] ${name}`, props ? JSON.stringify(props) : '');
}
