import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { I18nHelper } from "../../../locale/I18nHelper";
import "./submission-approval-modal.css";

type SubmissionApprovalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
};

const RULE_KEYS = [
  "pages.submissions.rules.1",
  "pages.submissions.rules.2",
  "pages.submissions.rules.3",
  "pages.submissions.rules.4",
  "pages.submissions.rules.5",
  "pages.submissions.rules.6",
  "pages.submissions.rules.7",
  "pages.submissions.rules.8",
  "pages.submissions.rules.9",
] as const;

export const SubmissionApprovalModal: React.FC<SubmissionApprovalModalProps> = ({
  isOpen,
  onClose,
  onAccept,
}) => {
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    I18nHelper.init()
      .then(() => setIsI18nReady(true))
      .catch(() => setIsI18nReady(false));
  }, [isOpen]);

  useEffect(() => {
    const findContainer = () => {
      const target = document.getElementById("runner-container");
      if (target) {
        setContainer(target);
        return true;
      }
      return false;
    };

    if (findContainer()) {
      return;
    }

    const interval = globalThis.setInterval(() => {
      if (findContainer()) {
        globalThis.clearInterval(interval);
      }
    }, 100);

    return () => globalThis.clearInterval(interval);
  }, []);

  const title = useMemo(
    () =>
      isI18nReady
        ? I18nHelper.get("pages.submissions.title")
        : "Submissions Terms of Service",
    [isI18nReady],
  );

  const rulesTitle = useMemo(
    () =>
      isI18nReady
        ? I18nHelper.get("pages.submissions.rules.title")
        : "Submission Rules & Guidelines",
    [isI18nReady],
  );

  const rules = useMemo(() => {
    if (isI18nReady) {
      return RULE_KEYS.map((key) => I18nHelper.get(key));
    }
    return [
      "<b class='keyword'>Inappropriate Content:</b> Any uploaded images must follow Overwolf's content policies. Submitting inappropriate images will result in a report to Overwolf.",
      "<b class='keyword'>Data Collection:</b> The only information collected with your submission is your Overwolf username and Overwolf ID.",
      "<b class='keyword'>Anonymity:</b> Your submission will be <b class='keyword'>anonymous to other users</b>.",
      "<b class='keyword'>Usage Rights:</b> By submitting an image, you grant Marathon Companion the right to use the image within the app.",
      "<b class='keyword'>Submission Limits:</b> Maximum <b class='keyword'>2 submissions</b> per <b class='keyword'>5 minutes</b>.",
      "<b class='keyword'>Image Submission Limits:</b> Maximum <b class='keyword'>10 images</b> per <b class='keyword'>5 minutes</b>.",
      "<b class='keyword'>Image Requirements:</b> Must have a <b class='keyword'>16:9 aspect ratio</b> and must <b class='keyword'>not exceed 8 MB</b> in file size",
      "<b class='keyword'>Violations & Bans:</b> Breaking these rules will result in a <b class='keyword'>ban from submitting content</b>.",
      "By continuing, you confirm that you have read and agreed to these conditions.",
    ];
  }, [isI18nReady]);

  const notice = useMemo(
    () =>
      isI18nReady
        ? I18nHelper.get("pages.submissions.notice")
        : "The edit feature is meant to let the community submit changes to quests and map icons in case the information is wrong",
    [isI18nReady],
  );

  const cancelLabel = useMemo(
    () => (isI18nReady ? I18nHelper.get("pages.submissions.no") : "Cancel"),
    [isI18nReady],
  );

  const acceptLabel = useMemo(
    () =>
      isI18nReady
        ? I18nHelper.get("pages.submissions.yes")
        : "Accept and Enable Submissions",
    [isI18nReady],
  );

  if (!isOpen || !container) {
    return null;
  }

  return createPortal(
    <div className="submission-approval-overlay" role="presentation" onClick={onClose}>
      <div
        className="submission-approval-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="submission-approval-header">
          <h3 className="submission-approval-title">{title}</h3>
          <button
            type="button"
            className="submission-approval-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>
        <div className="submission-approval-body">
          <div className="submission-approval-rules">
            {rules.map((rule, index) => (
              <p
                key={`submission-rule-${index}`}
                className={index === rules.length - 1 ? "submission-rule-final" : "submission-rule"}
                dangerouslySetInnerHTML={{ __html: rule }}
              />
            ))}
          </div>
          <p className="submission-approval-notice">{notice}</p>
          <div className="submission-approval-actions">
            <button
              type="button"
              className="submission-approval-button"
              onClick={onClose}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className="submission-approval-button primary"
              onClick={onAccept}
            >
              {acceptLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    container,
  );
};
