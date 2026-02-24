import React, { useState, useEffect } from 'react';
import { ExpeditionPhase } from './expedition/ExpeditionPhase';
import { ExpeditionPhase5 } from './expedition/ExpeditionPhase5';
import { ExpeditionPhase6 } from './expedition/ExpeditionPhase6';
import { ExpeditionProgressionService, ExpeditionProgression, PhaseState } from './expedition/ExpeditionProgressionService';
import { PROJECTS_CONFIG, getProjectConfig, ProjectConfig } from './expedition/expeditionPhasesConfig';
import { ResetConfirmationModal } from './expedition/ResetConfirmationModal';
import './expedition/expedition.css';

export interface PhaseItem {
  name: string;
  required: number;
  current: number;
  itemId?: string;
}

export interface Phase {
  id: number;
  title: string;
  description?: string;
  items?: PhaseItem[];
  isCoinPhase?: boolean;
  coinCategories?: {
    combat: { required: number; current: number };
    survival: { required: number; current: number };
    provisions: { required: number; current: number };
    materials: { required: number; current: number };
  };
  coinValue?: { required: number; current: number };
  state: PhaseState;
}

export const ExpeditionPage: React.FC = () => {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
  const [currentProjectId, setCurrentProjectId] = useState<string>('expedition');

  // Get current project config
  const currentProject = getProjectConfig(currentProjectId) || PROJECTS_CONFIG[0];

  // Load progression on mount and when project changes
  useEffect(() => {
    const loadProgression = async () => {
      setLoading(true);
      try {
        const progression = await ExpeditionProgressionService.loadProgression(currentProjectId);
        const phasesData = convertProgressionToPhases(progression, currentProjectId);
        setPhases(phasesData);
        // Completed phases start collapsed by default (empty set means all collapsed)
        setExpandedPhases(new Set());
      } catch (error) {
        console.warn('Error loading expedition progression:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgression();
  }, [currentProjectId]);

  // Convert progression data to Phase format for display
  const convertProgressionToPhases = (progression: ExpeditionProgression, projectId: string): Phase[] => {
    const projectConfig = getProjectConfig(projectId);
    if (!projectConfig) {
      return [];
    }

    return projectConfig.phases.map(config => {
      const progressPhase = progression.phases.find(p => p.id === config.id);
      
      const phase: Phase = {
        id: config.id,
        title: config.title,
        description: config.description,
        state: progressPhase?.state || 'blocked',
        isCoinPhase: config.isCoinPhase
      };

      // Map items
      if (config.items && config.items.length > 0) {
        phase.items = config.items.map(configItem => {
          const progressItem = progressPhase?.items?.find(i => i.name === configItem.name);
          // Get itemId from config or generate from name (lowercase with underscores)
          const itemId = configItem.itemId || configItem.name.toLowerCase().replace(/\s+/g, '_');
          return {
            name: configItem.name, // Keep original name as fallback, will be replaced by ItemsElementUtils if available
            required: configItem.required,
            current: progressItem?.current || 0,
            itemId: itemId
          };
        });
      }

      // Map coin categories
      if (config.isCoinPhase && config.coinCategories) {
        const progressCoins = progressPhase?.coinCategories || {
          combat: 0,
          survival: 0,
          provisions: 0,
          materials: 0
        };
        phase.coinCategories = {
          combat: { required: config.coinCategories.combat, current: progressCoins.combat },
          survival: { required: config.coinCategories.survival, current: progressCoins.survival },
          provisions: { required: config.coinCategories.provisions, current: progressCoins.provisions },
          materials: { required: config.coinCategories.materials, current: progressCoins.materials }
        };
      }

      // Map single coin value
      if (config.isCoinPhase && config.coinValue !== undefined) {
        const progressValue = progressPhase?.coinValue || 0;
        phase.coinValue = {
          required: config.coinValue,
          current: progressValue
        };
      }

      return phase;
    });
  };

  // Refresh phases from progression
  const refreshPhases = async () => {
    try {
      const progression = await ExpeditionProgressionService.loadProgression(currentProjectId);
      const phasesData = convertProgressionToPhases(progression, currentProjectId);
      setPhases(phasesData);
    } catch (error) {
      console.error('Error refreshing progression:', error);
    }
  };

  const handlePhaseComplete = async (phaseId: number) => {
    try {
      const phase = phases.find(p => p.id === phaseId);
      if (!phase) return;

      const newState: PhaseState = phase.state === 'completed' ? 'active' : 'completed';
      await ExpeditionProgressionService.updatePhaseState(phaseId, newState, currentProjectId);
      await refreshPhases();
    } catch (error) {
      console.error('Error updating phase state:', error);
    }
  };

  const handleItemUpdate = async (phaseId: number, itemName: string, newValue: number) => {
    try {
      await ExpeditionProgressionService.updateItemProgress(phaseId, itemName, newValue, currentProjectId);
      await refreshPhases();
    } catch (error) {
      console.error('Error updating item progress:', error);
    }
  };

  const handleCoinUpdate = async (
    phaseId: number,
    category: 'combat' | 'survival' | 'provisions' | 'materials',
    newValue: number
  ) => {
    try {
      await ExpeditionProgressionService.updateCoinProgress(phaseId, category, newValue, currentProjectId);
      await refreshPhases();
    } catch (error) {
      console.error('Error updating coin progress:', error);
    }
  };

  const handleCoinValueUpdate = async (phaseId: number, newValue: number) => {
    try {
      await ExpeditionProgressionService.updateCoinValue(phaseId, newValue, currentProjectId);
      await refreshPhases();
    } catch (error) {
      console.error('Error updating coin value:', error);
    }
  };

  const handleReset = async () => {
    try {
      await ExpeditionProgressionService.resetProgression(currentProjectId);
      await refreshPhases();
      setShowResetModal(false);
      setExpandedPhases(new Set()); // Reset expanded phases
    } catch (error) {
      console.error('Error resetting progression:', error);
    }
  };

  const handleProjectSwitch = (projectId: string) => {
    setCurrentProjectId(projectId);
    setExpandedPhases(new Set()); // Reset expanded phases when switching
  };

  const togglePhaseExpand = (phaseId: number) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
  };

  const completedPhases = phases.filter(p => p.state === 'completed').length;
  const totalPhases = phases.length;

  if (loading) {
    return (
      <div className="expedition-page-container runner">
        <div className="expedition-loading">
          <p>Loading expedition progression...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="expedition-page-container runner">
      <div className="expedition-page-content-wrapper scroll-div">
        <div className="expedition-header">
          <div className="expedition-header-top">
            <h1 className="expedition-title">{currentProject.name}</h1>
            <div className="expedition-project-switcher">
              {PROJECTS_CONFIG.map((project) => (
                <button
                  key={project.id}
                  className={`expedition-project-button ${currentProjectId === project.id ? 'active' : ''}`}
                  onClick={() => handleProjectSwitch(project.id)}
                  title={`Switch to ${project.name}`}
                >
                  {project.name}
                </button>
              ))}
            </div>
          </div>
          <p className="expedition-description">
            {currentProject.description}
          </p>
          <div className="expedition-progress">
            <div className="expedition-progress-content">
              <span className="expedition-progress-text">
                Progress <strong>{completedPhases}/{totalPhases} Phases</strong>
              </span>
              <button
                className="expedition-reset-button"
                onClick={() => setShowResetModal(true)}
                title="Reset all progression"
              >
                Reset Progression
              </button>
            </div>
            <div className="expedition-progress-bar">
              <div 
                className="expedition-progress-fill" 
                style={{ width: `${(completedPhases / totalPhases) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="expedition-phases">
        {phases.map((phase, index) => {
          // Check if previous phase is completed
          const previousPhaseCompleted = index === 0 
            ? true 
            : phases[index - 1]?.state === 'completed';
          
          const isExpanded = expandedPhases.has(phase.id);
          
          if (phase.isCoinPhase && phase.coinValue) {
            // Phase 6 - single coin value
            return (
              <ExpeditionPhase6
                key={phase.id}
                phase={phase}
                previousPhaseCompleted={previousPhaseCompleted}
                isExpanded={isExpanded}
                onToggleExpand={() => togglePhaseExpand(phase.id)}
                onComplete={() => handlePhaseComplete(phase.id)}
                onCoinValueUpdate={handleCoinValueUpdate}
              />
            );
          } else if (phase.isCoinPhase) {
            // Phase 5 - coin categories
            return (
              <ExpeditionPhase5
                key={phase.id}
                phase={phase}
                previousPhaseCompleted={previousPhaseCompleted}
                isExpanded={isExpanded}
                onToggleExpand={() => togglePhaseExpand(phase.id)}
                onComplete={() => handlePhaseComplete(phase.id)}
                onCoinUpdate={handleCoinUpdate}
              />
            );
          } else {
            // Regular phases with items
            return (
              <ExpeditionPhase
                key={phase.id}
                phase={phase}
                previousPhaseCompleted={previousPhaseCompleted}
                isExpanded={isExpanded}
                onToggleExpand={() => togglePhaseExpand(phase.id)}
                onComplete={() => handlePhaseComplete(phase.id)}
                onItemUpdate={handleItemUpdate}
              />
            );
          }
        })}
        </div>
      </div>

      <ResetConfirmationModal
        isOpen={showResetModal}
        onConfirm={handleReset}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
};
