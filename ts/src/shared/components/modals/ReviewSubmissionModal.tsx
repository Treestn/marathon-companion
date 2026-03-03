import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useOptionalMapSubmissionContext } from '../../context/MapSubmissionContext';
import { useOptionalQuestSubmissionContext } from '../../context/QuestSubmissionContext';
import type { RemovedMapIconEntry } from '../../context/MapSubmissionContext';
import type { QuestEditEntry } from '../../context/QuestSubmissionContext';
import type { EditMapDocument } from '../../pages/map/edit/useMapEditSession';
import type { SubmissionPayload } from '../../submission/SubmissionPayload';
import { prepareSubmissionPayload, groupRemovedMapIcons } from '../../submission/prepareSubmissionPayload';
import { createImageBlobFromFile } from '../../utils/imageBlob';
import { TarkovCompanionService } from '../../services/api/tarkov-companion/TarkovCompanionService';
import { I18nHelper } from '../../../locale/I18nHelper';
import './review-submission-modal.css';

// ---------------------------------------------------------------------------
// Sub-components – Section renderers
// ---------------------------------------------------------------------------

type ChangeGroup<T> = { added: T[]; edited: T[]; removed: T[] };

// ---- Map Icons Section ----

type MapIconItem = {
  mapId: string;
  layerName: string;
  description?: string;
  label?: string;
};

/** Extract added/edited items from a single edit doc's layers. */
const collectMapFeatureItems = (editDoc: EditMapDocument): { added: MapIconItem[]; edited: MapIconItem[] } => {
  const added: MapIconItem[] = [];
  const edited: MapIconItem[] = [];
  for (const group of editDoc.groups) {
    for (const layer of group.layers) {
      const editedSet = new Set(layer.editedFeatureIds);
      for (const feature of layer.data.features) {
        const item: MapIconItem = {
          mapId: editDoc.mapId,
          layerName: layer.name,
          description: feature.properties.description || undefined,
          label: layer.name,
        };
        (editedSet.has(feature.properties.id) ? edited : added).push(item);
      }
    }
  }
  return { added, edited };
};

/** Build the removed list from context entries + all editDocs' removedFeatureIds. */
const collectRemovedMapItems = (
  editDocs: EditMapDocument[],
  removedMapIcons: RemovedMapIconEntry[],
): MapIconItem[] => {
  const removed: MapIconItem[] = removedMapIcons.map((entry) => ({
    mapId: entry.mapId,
    layerName: entry.layerName,
    label: entry.label,
  }));
  for (const doc of editDocs) {
    for (const featureId of doc.removedFeatureIds) {
      removed.push({ mapId: doc.mapId, layerName: 'Unknown', label: `Icon #${featureId}` });
    }
  }
  return removed;
};

const categoriseMapEdits = (
  editDocs: EditMapDocument[],
  removedMapIcons: RemovedMapIconEntry[],
): ChangeGroup<MapIconItem> => {
  const added: MapIconItem[] = [];
  const edited: MapIconItem[] = [];
  for (const doc of editDocs) {
    const items = collectMapFeatureItems(doc);
    added.push(...items.added);
    edited.push(...items.edited);
  }
  const removed = collectRemovedMapItems(editDocs, removedMapIcons);
  return { added, edited, removed };
};

const MapIconEditsSection: React.FC<{
  editDocs: EditMapDocument[];
  removedMapIcons: RemovedMapIconEntry[];
}> = ({ editDocs, removedMapIcons }) => {
  const { added, edited, removed } = useMemo(
    () => categoriseMapEdits(editDocs, removedMapIcons),
    [editDocs, removedMapIcons],
  );

  if (added.length === 0 && edited.length === 0 && removed.length === 0) return null;

  return (
    <div className="review-section">
      <h4 className="review-section-title">🗺️ Map Icons</h4>
      <ChangeGroupRenderer
        added={added}
        edited={edited}
        removed={removed}
        renderItem={(item) => {
          const parts = [item.mapId, ' › ', item.layerName];
          if (item.description) { parts.push(' – ', item.description); }
          if (item.label) { parts.push(' – ', item.label); }
          return parts.join('');
        }}
      />
    </div>
  );
};

// ---- Quest Edits Section ----

type QuestItem = {
  questName: string;
  detail?: string;
};

const categoriseQuestEdits = (
  questEdits: QuestEditEntry[],
  removedQuestIds: string[],
): ChangeGroup<QuestItem> => {
  const added: QuestItem[] = [];
  const edited: QuestItem[] = [];

  for (const entry of questEdits) {
    const questName =
      entry.quest.locales?.[I18nHelper.currentLocale()] ?? entry.quest.name ?? entry.quest.id;

    if (entry.isNew) {
      added.push({
        questName,
        detail: `${entry.quest.objectives.length} objective(s)`,
      });
    } else {
      edited.push({
        questName,
        detail: 'modified',
      });
    }
  }

  const removed: QuestItem[] = removedQuestIds.map((id) => ({
    questName: id,
  }));

  return { added, edited, removed };
};

const QuestEditsSection: React.FC<{
  questEdits: QuestEditEntry[];
  removedQuestIds: string[];
}> = ({ questEdits, removedQuestIds }) => {
  const { added, edited, removed } = useMemo(
    () => categoriseQuestEdits(questEdits, removedQuestIds),
    [questEdits, removedQuestIds],
  );

  if (added.length === 0 && edited.length === 0 && removed.length === 0) return null;

  return (
    <div className="review-section">
      <h4 className="review-section-title">📋 Quests</h4>
      <ChangeGroupRenderer
        added={added}
        edited={edited}
        removed={removed}
        renderItem={(item) =>
          item.detail ? item.questName + ' (' + item.detail + ')' : item.questName
        }
      />
    </div>
  );
};

// ---- Images Section ----

/** Remote URLs are already hosted and don't need uploading. */
const isRemoteUrl = (path: string): boolean => path.startsWith('https://') || path.startsWith('http://');

/** Add local image paths from a single map edit doc to the given set. */
const addMapImagePaths = (editDoc: EditMapDocument, out: Set<string>): void => {
  for (const group of editDoc.groups) {
    for (const layer of group.layers) {
      for (const feature of layer.data.features) {
        feature.properties.imageList?.forEach((p) => { if (p && !isRemoteUrl(p)) out.add(p); });
      }
    }
  }
};

/** Add local image paths from quest edits to the given set. */
const addQuestImagePaths = (questEdits: QuestEditEntry[], out: Set<string>): void => {
  for (const entry of questEdits) {
    for (const obj of entry.quest.objectives) {
      for (const qi of obj.questImages ?? []) {
        qi.paths?.forEach((p) => { if (p && !isRemoteUrl(p)) out.add(p); });
      }
    }
  }
};

const collectAllImagePaths = (
  editDocs: EditMapDocument[],
  questEdits: QuestEditEntry[],
): string[] => {
  const paths = new Set<string>();
  for (const doc of editDocs) addMapImagePaths(doc, paths);
  addQuestImagePaths(questEdits, paths);
  return Array.from(paths);
};

/**
 * Small helper that loads a local file path via Overwolf's file API into a
 * blob URL so it can be rendered inside an <img> tag.
 */
const ReviewImageThumb: React.FC<{ filePath: string }> = ({ filePath }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let url: string | null = null;

    const stripFileScheme = (p: string) =>
      p.replace(/^file:\/\//i, '').replace(/^\/+/, '');

    createImageBlobFromFile(stripFileScheme(filePath), 'image/png')
      .then(({ url: blobUrl }) => {
        url = blobUrl;
        if (active) setBlobUrl(blobUrl);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [filePath]);

  if (error) {
    return <div className="review-image-thumb review-image-thumb--error" title={filePath}>⚠️</div>;
  }
  if (!blobUrl) {
    return <div className="review-image-thumb review-image-thumb--loading" title={filePath} />;
  }
  return <img className="review-image-thumb" src={blobUrl} alt="" title={filePath} />;
};

const ImagesToUploadSection: React.FC<{
  editDocs: EditMapDocument[];
  questEdits: QuestEditEntry[];
}> = ({ editDocs, questEdits }) => {
  const paths = useMemo(
    () => collectAllImagePaths(editDocs, questEdits),
    [editDocs, questEdits],
  );
  if (paths.length === 0) return null;

  return (
    <div className="review-section">
      <h4 className="review-section-title">🖼️ Images to Upload ({paths.length})</h4>
      <div className="review-images-list">
        {paths.map((p) => (
          <ReviewImageThumb key={p} filePath={p} />
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Generic change-group renderer (New / Modified / Removed)
// ---------------------------------------------------------------------------

function ChangeGroupRenderer<T>({
  added,
  edited,
  removed,
  renderItem,
}: Readonly<{
  added: readonly T[];
  edited: readonly T[];
  removed: readonly T[];
  renderItem: (item: T) => string;
}>) {
  const renderGroup = (items: readonly T[], label: string, kind: string) => {
    if (items.length === 0) return null;
    return (
      <div className="review-group">
        <p className={`review-group-label review-group-label--${kind}`}>
          ● {label} ({items.length})
        </p>
        {items.map((item) => {
          const text = renderItem(item);
          return (
            <div key={text} className="review-item">
              <span className={`review-item-dot review-item-dot--${kind}`} />
              <span className="review-item-text">{text}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {renderGroup(added, 'New', 'added')}
      {renderGroup(edited, 'Modified', 'edited')}
      {renderGroup(removed, 'Removed', 'removed')}
    </>
  );
}

// ---------------------------------------------------------------------------
// Submission states
// ---------------------------------------------------------------------------

type SubmitPhase =
  | { kind: 'idle' }
  | { kind: 'uploading-json' }
  | { kind: 'uploading-image'; current: number; total: number }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------

type ReviewSubmissionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
};

export const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
}) => {
  const { mapEditDocs, removedMapIcons } = useOptionalMapSubmissionContext();
  const { questEdits, removedQuestIds } = useOptionalQuestSubmissionContext();
  const [phase, setPhase] = useState<SubmitPhase>({ kind: 'idle' });

  const isSubmitting = phase.kind === 'uploading-json' || phase.kind === 'uploading-image';

  const handleClose = useCallback(() => {
    if (isSubmitting) return; // don't close while submitting
    setPhase({ kind: 'idle' });
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(async () => {
    try {
      // 1. Build raw payload matching backend ArcSubmission POJO
      const raw: SubmissionPayload = {
        quests: questEdits.map((e) => e.quest),
        hideoutStations: [],
        hideoutCrafts: [],
        mapFilters: mapEditDocs,
        removedQuests: removedQuestIds,
        removedHideoutCrafts: [],
        removedMapIcon: groupRemovedMapIcons(removedMapIcons),
      };

      // 2. Prepare (replace image paths with UUIDs)
      const { payload, images } = prepareSubmissionPayload(raw);

      // 3. Upload JSON
      setPhase({ kind: 'uploading-json' });
      const jsonResponse = await TarkovCompanionService.postSubmissionV2(payload);
      const submissionId = await jsonResponse.text();

      // Validate UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(submissionId)) {
        setPhase({ kind: 'error', message: `Submission failed: ${submissionId}` });
        return;
      }

      // 4. Upload images one-by-one
      for (let i = 0; i < images.length; i++) {
        setPhase({ kind: 'uploading-image', current: i + 1, total: images.length });
        const img = images[i];
        const { blob } = await createImageBlobFromFile(img.filePath);
        const imgResponse = await TarkovCompanionService.uploadImage(
          blob,
          img.imageId,
          submissionId,
        );
        if (!imgResponse.ok) {
          setPhase({
            kind: 'error',
            message: `Image upload failed (${i + 1}/${images.length})`,
          });
          return;
        }
      }

      // 5. Done!
      setPhase({ kind: 'done' });
      onSubmitSuccess?.();
    } catch (err) {
      setPhase({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [mapEditDocs, removedMapIcons, questEdits, removedQuestIds, onSubmitSuccess]);

  if (!isOpen) return null;

  const hasAnything =
    mapEditDocs.length > 0 ||
    removedMapIcons.length > 0 ||
    questEdits.length > 0 ||
    removedQuestIds.length > 0;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="review-modal-overlay" onClick={handleClose}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
      <dialog
        className="review-modal-card"
        open
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="review-modal-header">
          <h3 className="review-modal-title">Review &amp; Submit</h3>
          <button
            type="button"
            className="review-modal-close"
            onClick={handleClose}
            aria-label="Close"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </header>

        {/* Body */}
        <div className="review-modal-body">
          {!hasAnything && (
            <p className="review-modal-empty">No pending edits to submit.</p>
          )}

          <MapIconEditsSection editDocs={mapEditDocs} removedMapIcons={removedMapIcons} />
          <QuestEditsSection questEdits={questEdits} removedQuestIds={removedQuestIds} />
          <ImagesToUploadSection editDocs={mapEditDocs} questEdits={questEdits} />
        </div>

        {/* Footer */}
        <div className="review-modal-footer">
          {/* Progress / Status */}
          {phase.kind === 'uploading-json' && (
            <div className="review-progress">
              <span className="review-progress-text">Uploading submission…</span>
              <div className="review-progress-bar-track">
                <div className="review-progress-bar-fill" style={{ width: '15%' }} />
              </div>
            </div>
          )}
          {phase.kind === 'uploading-image' && (
            <div className="review-progress">
              <span className="review-progress-text">
                Uploading image {phase.current} of {phase.total}…
              </span>
              <div className="review-progress-bar-track">
                <div
                  className="review-progress-bar-fill"
                  style={{
                    width: `${Math.round((phase.current / phase.total) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
          {phase.kind === 'error' && (
            <p className="review-progress-error">{phase.message}</p>
          )}
          {phase.kind === 'done' && (
            <p className="review-progress-success">Submission successful!</p>
          )}

          {/* Action buttons */}
          <div className="review-modal-actions">
            <button
              type="button"
              className="review-modal-button"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {phase.kind === 'done' ? 'Close' : 'Cancel'}
            </button>
            {phase.kind !== 'done' && (
              <button
                type="button"
                className="review-modal-button primary"
                onClick={handleSubmit}
                disabled={!hasAnything || isSubmitting}
              >
                {isSubmitting ? 'Submitting…' : 'Submit'}
              </button>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
};
