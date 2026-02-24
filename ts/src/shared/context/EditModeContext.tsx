import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useUserStatusContext } from './UserStatusContext';

type EditModeContextValue = {
  isEditMode: boolean;
  canEdit: boolean;
  isAvailable: boolean;
  setEditMode: (value: boolean) => void;
  toggleEditMode: () => void;
};

const EditModeContext = createContext<EditModeContextValue | undefined>(undefined);

export const EditModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status } = useUserStatusContext();
  const canEdit = Boolean(status?.user?.isLoggedIn);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (!canEdit && isEditMode) {
      setIsEditMode(false);
    }
  }, [canEdit, isEditMode]);

  const setEditMode = (value: boolean) => {
    if (!value || canEdit) {
      setIsEditMode(value);
    }
  };

  const toggleEditMode = () => {
    if (canEdit) {
      setIsEditMode((prev) => !prev);
    }
  };

  const value = useMemo(
    () => ({
      isEditMode,
      canEdit,
      isAvailable: true,
      setEditMode,
      toggleEditMode,
    }),
    [canEdit, isEditMode],
  );

  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>;
};

export const useEditModeContext = () => {
  const ctx = useContext(EditModeContext);
  if (!ctx) {
    throw new Error('useEditModeContext must be used within EditModeProvider');
  }
  return ctx;
};

export const useOptionalEditModeContext = (): EditModeContextValue => {
  const ctx = useContext(EditModeContext);
  if (ctx) {
    return ctx;
  }
  return {
    isEditMode: false,
    canEdit: false,
    isAvailable: false,
    setEditMode: () => {},
    toggleEditMode: () => {},
  };
};
