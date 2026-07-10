import { create } from 'zustand';

interface PwaUpdateState {
  updateAvailable: boolean;
  waitingWorker: ServiceWorker | null;
  setUpdateAvailable: (worker: ServiceWorker) => void;
  clearUpdate: () => void;
}

export const usePwaUpdateStore = create<PwaUpdateState>((set) => ({
  updateAvailable: false,
  waitingWorker: null,
  setUpdateAvailable: (worker) => set({ updateAvailable: true, waitingWorker: worker }),
  clearUpdate: () => set({ updateAvailable: false, waitingWorker: null }),
}));
