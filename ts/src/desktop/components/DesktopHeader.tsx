import React, { useMemo } from "react";
import { VersionDisplay } from "../../shared/components/VersionDisplay";
import { WindowControlButton } from "../../shared/components/WindowControlButton";
import { OverwolfHotkeyDisplay } from "../../shared/components/hotkeys/OverwolfHotkeyDisplay";
import { SidePanelHotkeyDisplay } from "../../shared/components/hotkeys/SidePanelHotkeyDisplay";
import { openExternalLink } from "../../shared/services/ExternalLinkService";
import { emitOpenReviewModal } from "../../shared/services/ReviewSubmissionModalEvents";
import { useOptionalEditModeContext } from "../../shared/context/EditModeContext";
import { useOptionalMapSubmissionContext } from "../../shared/context/MapSubmissionContext";
import { useOptionalQuestSubmissionContext } from "../../shared/context/QuestSubmissionContext";
import { kHotkeys } from "../../consts";

type DesktopHeaderProps = {
  windowType: "desktop" | "ingame";
  isFirstTimeActive: boolean;
};

export const useDesktopHeaderActions = () => {
  const handleDiscordClick = () => {
    openExternalLink("https://discord.gg/Gx5TNfQpGb", "Discord");
  };

  const handleXClick = () => {
    openExternalLink("https://x.com/TarkovCompanion", "X");
  };

  return { handleDiscordClick, handleXClick };
};

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({ windowType, isFirstTimeActive }) => {
  const { handleDiscordClick, handleXClick } = useDesktopHeaderActions();

  const { isEditMode } = useOptionalEditModeContext();
  const { mapEditDocs, removedMapIcons } = useOptionalMapSubmissionContext();
  const { questEdits, removedQuestIds } = useOptionalQuestSubmissionContext();

  const hasAnyEdits = useMemo(() => {
    // Map edits from the live edit session (any map)
    if (mapEditDocs.length > 0) return true;
    if (removedMapIcons.length > 0) return true;
    if (questEdits.length > 0) return true;
    if (removedQuestIds.length > 0) return true;
    return false;
  }, [mapEditDocs, removedMapIcons, questEdits, removedQuestIds]);

  const showReviewButton = isEditMode && hasAnyEdits;

  return (
    <header className="app-header screen-header">
      <div className="screen-header-left">
        <img
          className="screen-logo"
          src="../../icons/logo-256x256.png"
          alt="Marathon Companion"
        />
        <h1 className="screen-title">Marathon Companion</h1>
        <VersionDisplay />
      </div>

      {showReviewButton && (
        <div className="screen-header-center">
          <button
            type="button"
            className="review-submit-button"
            onClick={() => emitOpenReviewModal()}
          >
            Review &amp; Submit
          </button>
        </div>
      )}

      <div className="screen-controls">
        {windowType === "ingame" && (
          <>
            <OverwolfHotkeyDisplay label="In-Game" hotkeyName={kHotkeys.toggle} />
            <OverwolfHotkeyDisplay label="Second Screen" hotkeyName={kHotkeys.secondScreenToggle} />
          </>
        )}
        {!isFirstTimeActive && windowType === "desktop" && <SidePanelHotkeyDisplay />}
        {!isFirstTimeActive && (
            <>
              <button
                type="button"
                className="window-control window-control-discord"
                aria-label="Open Discord"
                onClick={handleDiscordClick}
              />
              <button
                type="button"
                className="window-control window-control-x"
                aria-label="Open X"
                onClick={handleXClick}
              />
            </>
          )
        }

        <div id="react-window-control-minimize">
          <WindowControlButton type="minimize" />
        </div>
        <div id="react-window-control-maximize">
          <WindowControlButton type="maximize" />
        </div>
        <div id="react-window-control-close">
          <WindowControlButton type="close" />
        </div>
      </div>
    </header>
  );
};
