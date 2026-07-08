'use client';

import { useEffect, useState } from 'react';

export interface BatteryStatus {
  supported: boolean;
  level: number | null;
  charging: boolean | null;
  savingMode: boolean;
}

export function useBatteryStatus(): BatteryStatus {
  const [status, setStatus] = useState<BatteryStatus>({
    supported: false,
    level: null,
    charging: null,
    savingMode: false,
  });

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
      return;
    }

    let cancelled = false;
    let battery: BatteryManager | null = null;

    const update = () => {
      if (!battery || cancelled) {
        return;
      }

      setStatus({
        supported: true,
        level: battery.level,
        charging: battery.charging,
        savingMode: battery.level <= 0.2 && !battery.charging,
      });
    };

    void (navigator as Navigator & { getBattery: () => Promise<BatteryManager> })
      .getBattery()
      .then((manager) => {
        if (cancelled) {
          return;
        }

        battery = manager;
        update();
        manager.addEventListener('levelchange', update);
        manager.addEventListener('chargingchange', update);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (battery) {
        battery.removeEventListener('levelchange', update);
        battery.removeEventListener('chargingchange', update);
      }
    };
  }, []);

  return status;
}

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
}
