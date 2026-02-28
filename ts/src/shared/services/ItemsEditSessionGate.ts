const ITEMS_EDIT_SESSION_KEY = "itemsEditEnabled";
const ITEMS_EDIT_SESSION_CHANGED_EVENT = "items-edit-session-changed";

const toFlagValue = (value: string | null | undefined): boolean => {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

export const isItemsEditSessionEnabled = (): boolean => {
  try {
    return toFlagValue(sessionStorage.getItem(ITEMS_EDIT_SESSION_KEY));
  } catch {
    return false;
  }
};

export const setItemsEditSessionEnabled = (enabled: boolean): boolean => {
  try {
    sessionStorage.setItem(ITEMS_EDIT_SESSION_KEY, enabled ? "true" : "false");
  } catch {
    return false;
  }
  globalThis.dispatchEvent(new Event(ITEMS_EDIT_SESSION_CHANGED_EVENT));
  return isItemsEditSessionEnabled();
};

export const ensureItemsEditSessionConsoleApi = (): void => {
  (globalThis as any).setItemsEditSessionEnabled = setItemsEditSessionEnabled;
  (globalThis as any).getItemsEditSessionEnabled = isItemsEditSessionEnabled;
};

export const subscribeItemsEditSessionEnabled = (
  onChange: (enabled: boolean) => void,
): (() => void) => {
  const handleChange = () => onChange(isItemsEditSessionEnabled());
  globalThis.addEventListener(ITEMS_EDIT_SESSION_CHANGED_EVENT, handleChange);
  globalThis.addEventListener("focus", handleChange);
  return () => {
    globalThis.removeEventListener(ITEMS_EDIT_SESSION_CHANGED_EVENT, handleChange);
    globalThis.removeEventListener("focus", handleChange);
  };
};

