export interface SystemModule {
  id: string;
  code: string;
  name: string;
  icon: string;
  badge: string;
  description: string;
  responsibilities: string[];
  keyEntities: string[];
  securityLevel: 'Crítico' | 'Alto' | 'Medio';
  apiEndpoints: string[];
  businessRules: string[];
}

export interface UserStory {
  id: string;
  code: string;
  module: string;
  title: string;
  role: string;
  narrative: {
    asA: string;
    iWant: string;
    soThat: string;
  };
  priority: 'Alta (Must Have)' | 'Media (Should Have)' | 'Baja (Could Have)';
  estimationStoryPoints: number;
  acceptanceCriteria: {
    scenario: string;
    given: string;
    when: string;
    then: string;
  }[];
}

export interface UseCase {
  id: string;
  code: string;
  name: string;
  primaryActor: string;
  secondaryActors?: string[];
  preconditions: string[];
  postconditions: string[];
  mainFlow: string[];
  alternativeFlows: {
    condition: string;
    steps: string[];
  }[];
}

export interface PermissionMatrixItem {
  moduleId: string;
  moduleName: string;
  actions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
}

export interface ArchitectureLayer {
  layer: string;
  technology: string;
  role: string;
  defenseReason: string;
  securityMeasures: string[];
}
