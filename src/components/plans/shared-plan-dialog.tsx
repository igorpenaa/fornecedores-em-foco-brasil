
import { PlanSelectionDialog } from "./plan-selection-dialog";
import { create } from "zustand";
import { useEffect } from "react";

interface PlanDialogStore {
  isOpen: boolean;
  userClosedDialog: boolean;
  setIsOpen: (open: boolean, userAction?: boolean) => void;
  resetUserClosed: () => void;
}

export const usePlanDialog = create<PlanDialogStore>((set) => ({
  isOpen: false,
  userClosedDialog: false,
  setIsOpen: (open, userAction = false) => set((state) => {
    // Evitar atualizações desnecessárias
    if (state.isOpen === open) return state;
    
    // Se o usuário está fechando explicitamente o diálogo, registre isso
    if (userAction && !open) {
      return { isOpen: open, userClosedDialog: true };
    }
    
    return { isOpen: open };
  }),
  resetUserClosed: () => set({ userClosedDialog: false }),
}));

export function SharedPlanDialog() {
  const { isOpen, setIsOpen } = usePlanDialog();
  
  // Manipula o fechamento do diálogo, indicando que foi uma ação do usuário
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open, true);
  };
  
  return (
    <PlanSelectionDialog 
      open={isOpen} 
      onOpenChange={handleOpenChange}
    />
  );
}
