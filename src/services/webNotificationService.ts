/**
 * Servicio de Notificaciones Push Web para Botica Nova Salud
 * Utiliza la API nativa del navegador: window.Notification
 * Proporciona soporte para segundo plano, sonido sintético Web Audio y fallback interactivo.
 */

export interface PushNotificationPayload {
  id: string;
  title: string;
  body: string;
  category: 'CRITICO' | 'ALTO' | 'MEDIO' | 'INFO';
  timestamp: Date;
  productCode?: string;
  batchCode?: string;
  actionUrl?: string;
}

class WebNotificationService {
  private hasSupport: boolean = false;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.hasSupport = typeof window !== 'undefined' && 'Notification' in window;
  }

  public isSupported(): boolean {
    return this.hasSupport;
  }

  public getPermission(): NotificationPermission {
    if (!this.hasSupport) return 'denied';
    try {
      return Notification.permission;
    } catch {
      return 'default';
    }
  }

  /**
   * Solicita permiso al usuario para enviar notificaciones web
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.hasSupport) {
      console.warn('[WebNotifications] Notifications API not supported in this browser.');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('[WebNotifications] Error requesting permission:', error);
      return 'denied';
    }
  }

  /**
   * Reproduce un tono de alerta suave utilizando Web Audio API
   * Útil cuando el dashboard está en segundo plano o minimizado
   */
  public playAlertSound(severity: 'CRITICO' | 'ALTO' | 'MEDIO' | 'INFO' = 'MEDIO'): void {
    if (typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioContextClass();
      }

      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (severity === 'CRITICO') {
        // Tono doble de urgencia (880Hz -> 1100Hz)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1174, now + 0.15);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (severity === 'ALTO') {
        // Tono de campana de atención (659Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // Notificación suave (523Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // Ignorar restricciones de autoplay si no hubo interacción previa
    }
  }

  /**
   * Despacha una notificación push nativa del navegador
   */
  public sendNotification(payload: PushNotificationPayload): boolean {
    // Reproducir sonido si la pestaña está en segundo plano o activa
    this.playAlertSound(payload.category);

    if (!this.hasSupport) return false;

    try {
      if (Notification.permission === 'granted') {
        const iconUrl = 'https://api.iconify.design/lucide:pill.svg?color=%2310b981';
        
        const notification = new Notification(`Nova Salud: ${payload.title}`, {
          body: payload.body,
          icon: iconUrl,
          badge: iconUrl,
          tag: payload.id || `alert-${Date.now()}`,
          requireInteraction: payload.category === 'CRITICO', // Permanece hasta que el admin la cierre
          silent: false,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return true;
      }
    } catch (e) {
      console.warn('[WebNotifications] Error creating native notification:', e);
    }

    return false;
  }
}

export const webNotificationService = new WebNotificationService();
