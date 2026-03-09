import type { EditMapDocument } from '../pages/map/edit/useMapEditSession';
import type { Quest } from '../../model/quest/IQuestsElements';

// ---------------------------------------------------------------------------
// Backend-compatible types for removed map icons
// (matches Java: RemovedMapIcon / IconType)
// ---------------------------------------------------------------------------

export type SubmissionIconType = {
  type: string;
  path: string;
  iconIds: Array<string | number>;
};

export type SubmissionRemovedMapIcon = {
  map: string;
  iconTypes: SubmissionIconType[];
};

// ---------------------------------------------------------------------------
// ArcSubmission payload
// ---------------------------------------------------------------------------

/**
 * Matches the backend's `ArcSubmission` POJO.
 * Field names **must** match the Java field names exactly so Jackson
 * deserializes correctly.
 *
 * All fields are required – use empty arrays when a section has no edits.
 */
export type SubmissionPayload = {
  quests: Quest[];
  hideoutStations: unknown[];
  hideoutCrafts: unknown[];
  mapFilters: EditMapDocument[];
  removedQuests: string[];
  removedHideoutCrafts: string[];
  removedMapIcon: SubmissionRemovedMapIcon[];
};

/**
 * Wrapper expected by backend `SubmissionV2`.
 */
export type SubmissionV2Request = {
  overwolfId: string;
  overwolfName: string;
  game: string;
  submission: SubmissionPayload;
};

// ---------------------------------------------------------------------------
// Image entry used during upload
// ---------------------------------------------------------------------------

export type SubmissionImageEntry = {
  /** UUID that replaces the file path in the payload */
  imageId: string;
  /** Original local file path */
  filePath: string;
};
