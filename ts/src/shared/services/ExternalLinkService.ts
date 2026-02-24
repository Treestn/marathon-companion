import { AppConfigClient } from "./AppConfigClient";
import { openExternalLinkModal } from "./ExternalLinkModalEvents";

export const openExternalLink = (url: string, label?: string): void => {
  const warningPref =
    AppConfigClient.getConfig()?.userSettings?.externalLinkWarning;
  if (warningPref === "false") {
    window.open(url, "_blank");
    return;
  }
  openExternalLinkModal({ url, label });
};
