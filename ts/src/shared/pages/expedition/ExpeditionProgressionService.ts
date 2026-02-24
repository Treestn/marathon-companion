import { PROJECTS_CONFIG, getProjectConfig, PhaseConfig, ProjectConfig } from './expeditionPhasesConfig';

export type PhaseState = 'blocked' | 'active' | 'completed';

export interface PhaseItemProgress {
  name: string;
  required: number;
  current: number;
}

export interface PhaseProgress {
  id: number;
  state: PhaseState;
  items?: PhaseItemProgress[];
  coinCategories?: {
    combat: number;
    survival: number;
    provisions: number;
    materials: number;
  };
  coinValue?: number; // For single-value coin phases (e.g., Phase 6)
}

export interface ExpeditionProgression {
  id: string;
  projectId?: string; // Optional for backward compatibility, defaults to 'expedition'
  phases: PhaseProgress[];
  lastUpdated: number;
}

export class ExpeditionProgressionService {
  private static db: IDBDatabase | null = null;
  private static readonly DB_NAME = 'expeditionProgression';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'expeditionProgressionStore';
  private static readonly DEFAULT_PROJECT_ID = 'expedition';

  /**
   * Open the IndexedDB database
   */
  private static async openDatabase(): Promise<IDBDatabase> {
    if (this.db) {
      return Promise.resolve(this.db);
    }

    return new Promise((resolve, reject) => {
      const request: IDBOpenDBRequest = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get progression from database
   */
  private static async getProgressionFromDb(projectId: string): Promise<ExpeditionProgression | null> {
    const db = await this.openDatabase();
    const entryId = `${projectId}ProgressionEntry`;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(entryId);

      request.onsuccess = () => {
        const result = request.result;
        // Handle backward compatibility - if old entry exists without projectId, migrate it
        if (result && !result.projectId) {
          result.projectId = projectId;
          result.id = entryId;
        }
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save progression to database
   */
  private static async saveToDb(progression: ExpeditionProgression): Promise<void> {
    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      progression.lastUpdated = Date.now();
      const request = store.put(progression);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Create a new progression with Phase 1 active and others blocked
   */
  private static createNewProgression(projectId: string): ExpeditionProgression {
    const projectConfig = getProjectConfig(projectId);
    if (!projectConfig) {
      throw new Error(`Project ${projectId} not found`);
    }

    const phases: PhaseProgress[] = projectConfig.phases.map((config, index) => {
      const phase: PhaseProgress = {
        id: config.id,
        state: index === 0 ? 'active' : 'blocked'
      };

      // Initialize items
      if (config.items && config.items.length > 0) {
        phase.items = config.items.map(item => ({
          name: item.name,
          required: item.required,
          current: 0
        }));
      }

      // Initialize coin categories
      if (config.isCoinPhase && config.coinCategories) {
        phase.coinCategories = {
          combat: 0,
          survival: 0,
          provisions: 0,
          materials: 0
        };
      }

      // Initialize single coin value
      if (config.isCoinPhase && config.coinValue !== undefined) {
        phase.coinValue = 0;
      }

      return phase;
    });

    return {
      id: `${projectId}ProgressionEntry`,
      projectId,
      phases,
      lastUpdated: Date.now()
    };
  }

  /**
   * Merge stored progression with config, handling additions/modifications
   */
  private static mergeProgressionWithConfig(
    storedProgression: ExpeditionProgression,
    projectId: string
  ): ExpeditionProgression {
    const projectConfig = getProjectConfig(projectId);
    if (!projectConfig) {
      throw new Error(`Project ${projectId} not found`);
    }

    const mergedPhases: PhaseProgress[] = projectConfig.phases.map((config) => {
      // Find existing phase in stored progression
      const existingPhase = storedProgression.phases.find(p => p.id === config.id);

      if (existingPhase) {
        // Phase exists - merge with config
        const mergedPhase: PhaseProgress = {
          id: config.id,
          state: existingPhase.state
        };

        // Merge items
        if (config.items && config.items.length > 0) {
          mergedPhase.items = config.items.map(configItem => {
            const existingItem = existingPhase.items?.find(i => i.name === configItem.name);
            if (existingItem) {
              // Item exists - keep progress but update required if changed
              return {
                name: configItem.name,
                required: configItem.required,
                current: existingItem.current
              };
            } else {
              // New item in config - initialize
              return {
                name: configItem.name,
                required: configItem.required,
                current: 0
              };
            }
          });
        }

        // Merge coin categories
        if (config.isCoinPhase && config.coinCategories) {
          mergedPhase.coinCategories = existingPhase.coinCategories || {
            combat: 0,
            survival: 0,
            provisions: 0,
            materials: 0
          };
        }

        // Merge single coin value
        if (config.isCoinPhase && config.coinValue !== undefined) {
          mergedPhase.coinValue = existingPhase.coinValue || 0;
        }

        return mergedPhase;
      } else {
        // New phase in config - initialize as blocked
        const newPhase: PhaseProgress = {
          id: config.id,
          state: 'blocked'
        };

        if (config.items && config.items.length > 0) {
          newPhase.items = config.items.map(item => ({
            name: item.name,
            required: item.required,
            current: 0
          }));
        }

        if (config.isCoinPhase && config.coinCategories) {
          newPhase.coinCategories = {
            combat: 0,
            survival: 0,
            provisions: 0,
            materials: 0
          };
        }

        if (config.isCoinPhase && config.coinValue !== undefined) {
          newPhase.coinValue = 0;
        }

        return newPhase;
      }
    });

    // Ensure Phase 1 is active if no phases are completed
    const hasCompletedPhase = mergedPhases.some(p => p.state === 'completed');
    if (!hasCompletedPhase && mergedPhases.length > 0) {
      mergedPhases[0].state = 'active';
    }

    return {
      id: `${projectId}ProgressionEntry`,
      projectId,
      phases: mergedPhases,
      lastUpdated: Date.now()
    };
  }

  /**
   * Load progression from database or create new one
   */
  static async loadProgression(projectId: string = this.DEFAULT_PROJECT_ID): Promise<ExpeditionProgression> {
    const stored = await this.getProgressionFromDb(projectId);

    if (!stored) {
      // No stored progression - create new one
      const newProgression = this.createNewProgression(projectId);
      await this.saveToDb(newProgression);
      return newProgression;
    }

    // Merge stored progression with current config
    const effectiveProjectId = stored.projectId || projectId;
    const merged = this.mergeProgressionWithConfig(stored, effectiveProjectId);
    merged.projectId = effectiveProjectId;
    merged.id = `${effectiveProjectId}ProgressionEntry`;
    await this.saveToDb(merged);
    return merged;
  }

  /**
   * Reset progression to initial state
   */
  static async resetProgression(projectId: string = this.DEFAULT_PROJECT_ID): Promise<ExpeditionProgression> {
    const newProgression = this.createNewProgression(projectId);
    await this.saveToDb(newProgression);
    return newProgression;
  }

  /**
   * Save progression to database
   */
  static async saveProgression(progression: ExpeditionProgression): Promise<void> {
    await this.saveToDb(progression);
  }

  /**
   * Update phase state
   */
  static async updatePhaseState(
    phaseId: number,
    newState: PhaseState,
    projectId: string = this.DEFAULT_PROJECT_ID
  ): Promise<ExpeditionProgression> {
    const progression = await this.loadProgression(projectId);
    const phase = progression.phases.find(p => p.id === phaseId);

    if (!phase) {
      throw new Error(`Phase ${phaseId} not found`);
    }

    // If marking as completed, auto-complete all items/coins to required values
    if (newState === 'completed') {
      const projectConfig = getProjectConfig(projectId);
      const config = projectConfig?.phases.find(c => c.id === phaseId);
      
      // Auto-complete items
      if (config?.items && phase.items) {
        phase.items.forEach(item => {
          const configItem = config.items!.find(ci => ci.name === item.name);
          if (configItem && item.current < configItem.required) {
            item.current = configItem.required;
          }
        });
      }

      // Auto-complete coin categories
      if (config?.isCoinPhase && config.coinCategories && phase.coinCategories) {
        phase.coinCategories.combat = Math.max(phase.coinCategories.combat, config.coinCategories.combat);
        phase.coinCategories.survival = Math.max(phase.coinCategories.survival, config.coinCategories.survival);
        phase.coinCategories.provisions = Math.max(phase.coinCategories.provisions, config.coinCategories.provisions);
        phase.coinCategories.materials = Math.max(phase.coinCategories.materials, config.coinCategories.materials);
      }

      // Auto-complete single coin value
      if (config?.isCoinPhase && config.coinValue !== undefined && phase.coinValue !== undefined) {
        phase.coinValue = Math.max(phase.coinValue, config.coinValue);
      }
    }

    phase.state = newState;

    // If phase is completed, activate next phase
    if (newState === 'completed') {
      const currentIndex = progression.phases.findIndex(p => p.id === phaseId);
      if (currentIndex < progression.phases.length - 1) {
        const nextPhase = progression.phases[currentIndex + 1];
        if (nextPhase.state === 'blocked') {
          nextPhase.state = 'active';
        }
      }
    }

    await this.saveProgression(progression);
    return progression;
  }

  /**
   * Update item progress
   */
  static async updateItemProgress(
    phaseId: number,
    itemName: string,
    current: number,
    projectId: string = this.DEFAULT_PROJECT_ID
  ): Promise<ExpeditionProgression> {
    const progression = await this.loadProgression(projectId);
    const phase = progression.phases.find(p => p.id === phaseId);

    if (!phase || !phase.items) {
      throw new Error(`Phase ${phaseId} or items not found`);
    }

    const item = phase.items.find(i => i.name === itemName);
    if (!item) {
      throw new Error(`Item ${itemName} not found in phase ${phaseId}`);
    }

    item.current = current;
    await this.saveProgression(progression);
    return progression;
  }

  /**
   * Update coin category progress
   */
  static async updateCoinProgress(
    phaseId: number,
    category: 'combat' | 'survival' | 'provisions' | 'materials',
    value: number,
    projectId: string = this.DEFAULT_PROJECT_ID
  ): Promise<ExpeditionProgression> {
    const progression = await this.loadProgression(projectId);
    const phase = progression.phases.find(p => p.id === phaseId);

    if (!phase || !phase.coinCategories) {
      throw new Error(`Phase ${phaseId} or coin categories not found`);
    }

    phase.coinCategories[category] = value;
    await this.saveProgression(progression);
    return progression;
  }

  /**
   * Update single coin value progress
   */
  static async updateCoinValue(
    phaseId: number,
    value: number,
    projectId: string = this.DEFAULT_PROJECT_ID
  ): Promise<ExpeditionProgression> {
    const progression = await this.loadProgression(projectId);
    const phase = progression.phases.find(p => p.id === phaseId);

    if (!phase || phase.coinValue === undefined) {
      throw new Error(`Phase ${phaseId} or coin value not found`);
    }

    phase.coinValue = value;
    await this.saveProgression(progression);
    return progression;
  }
}

