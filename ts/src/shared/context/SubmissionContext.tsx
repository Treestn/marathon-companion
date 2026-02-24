import React from 'react';

import { HideoutSubmissionProvider } from './HideoutSubmissionContext';
import { MapEditPlacementProvider } from './MapEditPlacementContext';
import { MapSubmissionProvider } from './MapSubmissionContext';
import { QuestSubmissionProvider } from './QuestSubmissionContext';

export {
  MapSubmissionProvider,
  useMapSubmissionContext,
  useOptionalMapSubmissionContext,
  type MapSubmissionContextValue,
  type RemovedMapIconEntry,
} from './MapSubmissionContext';
export {
  QuestSubmissionProvider,
  useQuestSubmissionContext,
  useOptionalQuestSubmissionContext,
  type QuestSubmissionContextValue,
  type QuestEditEntry,
} from './QuestSubmissionContext';
export {
  HideoutSubmissionProvider,
  useHideoutSubmissionContext,
  type HideoutSubmissionContextValue,
} from './HideoutSubmissionContext';

export const SubmissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MapSubmissionProvider>
    <MapEditPlacementProvider>
      <QuestSubmissionProvider>
        <HideoutSubmissionProvider>{children}</HideoutSubmissionProvider>
      </QuestSubmissionProvider>
    </MapEditPlacementProvider>
  </MapSubmissionProvider>
);
