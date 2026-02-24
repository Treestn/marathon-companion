import React, { createContext, useContext, useMemo, useState } from 'react';

export type HideoutSubmissionContextValue = {
  hideoutEdits: unknown[];
  clearHideoutEdits: () => void;
};

const HideoutSubmissionContext = createContext<HideoutSubmissionContextValue | undefined>(undefined);

export const HideoutSubmissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideoutEdits, setHideoutEdits] = useState<unknown[]>([]);

  const clearHideoutEdits = () => {
    setHideoutEdits([]);
  };

  const value = useMemo(
    () => ({
      hideoutEdits,
      clearHideoutEdits,
    }),
    [hideoutEdits],
  );

  return (
    <HideoutSubmissionContext.Provider value={value}>
      {children}
    </HideoutSubmissionContext.Provider>
  );
};

export const useHideoutSubmissionContext = () => {
  const ctx = useContext(HideoutSubmissionContext);
  if (!ctx) {
    throw new Error('useHideoutSubmissionContext must be used within HideoutSubmissionProvider');
  }
  return ctx;
};
