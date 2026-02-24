import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ReviewSubmissionModal } from './ReviewSubmissionModal';
import { subscribeReviewModalOpen } from '../../services/ReviewSubmissionModalEvents';
import { useOptionalMapSubmissionContext } from '../../context/MapSubmissionContext';
import { useOptionalQuestSubmissionContext } from '../../context/QuestSubmissionContext';

export const ReviewSubmissionModalHost: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  const { clearMapEdits, clearRemovedMapIcons, setMapEditDocs } = useOptionalMapSubmissionContext();
  const { clearQuestEdits } = useOptionalQuestSubmissionContext();

  // Listen for "open" events from the header button
  useEffect(() => {
    return subscribeReviewModalOpen(() => {
      setIsOpen(true);
    });
  }, []);

  // Find the portal container
  useEffect(() => {
    const findContainer = () => {
      const target = document.getElementById('runner-container');
      if (target) {
        setContainer(target);
        return true;
      }
      return false;
    };

    if (findContainer()) return;

    const interval = globalThis.setInterval(() => {
      if (findContainer()) {
        globalThis.clearInterval(interval);
      }
    }, 100);

    return () => globalThis.clearInterval(interval);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSubmitSuccess = useCallback(() => {
    // Clear all edit contexts on successful submission
    clearMapEdits();
    clearRemovedMapIcons();
    setMapEditDocs([]);
    clearQuestEdits();
  }, [clearMapEdits, clearRemovedMapIcons, setMapEditDocs, clearQuestEdits]);

  const modal = useMemo(
    () => (
      <ReviewSubmissionModal
        isOpen={isOpen}
        onClose={handleClose}
        onSubmitSuccess={handleSubmitSuccess}
      />
    ),
    [isOpen, handleClose, handleSubmitSuccess],
  );

  if (!container) return null;

  return createPortal(modal, container);
};
