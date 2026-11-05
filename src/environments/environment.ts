export interface AppEnvironment {
  readonly firebase: {
    readonly apiKey: string;
    readonly authDomain: string;
    readonly projectId: string;
    readonly appId: string;
  };
  readonly adminEmails: readonly string[];
  readonly allowDemoRoleSwitch: boolean;
}

export const environment: AppEnvironment = {
  firebase: {
    apiKey: 'AIzaSyBvNFPvcRc7-bXcUOLRF3OIRuGPo3o8xaw',
    authDomain: 'tripzy-d6e50.firebaseapp.com',
    projectId: 'tripzy-d6e50',
    appId: '1:289852094452:web:8532557687696a6deaaba1',
  },
  adminEmails: ["navneetg785@gmail.com"],
  allowDemoRoleSwitch: true,
};
