
import { PlanSelectionDialog } from "./plan-selection-dialog";
import { create } from "zustand";

interface PlanDialogStore {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const usePlanDialog = create<PlanDialogStore>((set) => ({
  isOpen: false,
  setIsOpen: (open) => set((state) => {
    // Only update if the value is actually changing
    if (state.isOpen !== open) {
      return { isOpen: open };
    }
    return state;
  }),
}));

export function SharedPlanDialog() {
  const { isOpen, setIsOpen } = usePlanDialog();
  
  return (
    <PlanSelectionDialog 
      open={isOpen} 
      onOpenChange={setIsOpen}
    />
  );
}
