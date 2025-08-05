
import { AlarmDto } from '@/types/alarm';
import { create } from 'zustand';


interface AlarmStore {
  info: Partial<AlarmDto>;
  setAlarmInfo: (u: Partial<AlarmDto>) => void;
  clearAlarmInfo: () => void;
}

export const useAlarmStore = create<AlarmStore>((set) => ({
  info: {},
  setAlarmInfo: (u) => set((state) => ({ info: { ...state.info, ...u } })),
  clearAlarmInfo: () => set({ info: {} }),
}));
