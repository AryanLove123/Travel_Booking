import { computed, inject, Injectable, signal } from '@angular/core';
import { AppUser, UserRole } from '../../models/domain.model';
import { STORAGE_KEYS, StorageService } from '../storage/storage.service';
import type { Auth } from 'firebase/auth';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  storage = inject(StorageService);
  user = signal<AppUser | null>(null);
  demoRole = signal<UserRole>('customer');
  error = signal<string | null>(null);
  busy = signal(false);
  firebaseAuth: Auth | null = null;

  isAuthenticated = computed(() => this.user() !== null);
  firebaseConfigured = environment.firebase.apiKey.trim().length > 0;

  role = computed<UserRole>(() =>{
    const user = this.user();
    if(!user) return 'customer';
    if(user.provider === 'demo') return user.uid === DEMO_USERS.admin.uid ? 'admin' : 'customer';
    if (environment.adminEmails.map((e) => e.toLowerCase()).includes(user.email.toLowerCase())) return 'admin';
    return this.demoRole();
  });

  isAdmin = computed(() => this.role() === 'admin');

  async init(): Promise<void>{
    const demoRole = this.storage.read(STORAGE_KEYS.demoRole, isRole);
    if(demoRole) this.demoRole.set(demoRole);

    const savedDemo = this.storage.read(STORAGE_KEYS.demoRole, isAppUser);
    if(savedDemo && savedDemo.provider === 'demo'){
      this.user.set(savedDemo);
    } 
    if(!this.firebaseConfigured) return;

    try{
      const {auth, onAuthStateChanged} = await this.loadFirebase();
      await new Promise<void>((resolve) =>{
        const timer = setTimeout(resolve, 2500);
        onAuthStateChanged(auth, (fbUser) => {
          if(fbUser){
            this.user.set({
              uid: fbUser.uid,
              email: fbUser.email ?? '',
              displayName: fbUser.displayName ?? fbUser.email ?? 'Traveller',
              photoUrl: fbUser.photoURL,
              provider: 'google',
            });
          }
          else if(this.user()?.provider === 'google'){
            this.user.set(null); // from firebase no active user returned so cleaning up
          }
          clearTimeout(timer);
          resolve();
        });
      });
    }
    catch{
      this.error.set('Could not initalise firebase');
    }
  }

  async signInWithGoogle(): Promise<boolean>{
    if(!this.firebaseConfigured){
      this.error.set('Firebase is not configured');
      return false;
    }
    this.busy.set(true);
    this.error.set(null);

    try{
      const {auth} = await this.loadFirebase();
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');

      const credential = await signInWithPopup(auth, new GoogleAuthProvider());

      const u = credential.user;

      this.user.set({
        uid: u.uid,
        email: u.email ?? '',
        displayName: u.displayName ?? u.email ?? 'Traveller',
        photoUrl: u.photoURL,
        provider: 'google',
      });
      return true;
    }
    catch(error){
      this.error.set(describeAuthError(error));
      return false;
    }
    finally{
      this.busy.set(false);
    }
  }

  private async loadFirebase(){
    const [{ initializeApp, getApps, getApp }, { getAuth, onAuthStateChanged }] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
    ]);

    const app = getApps().length > 0 ? getApp() : initializeApp(environment.firebase);
    this.firebaseAuth = getAuth(app);
    return {auth: this.firebaseAuth, onAuthStateChanged};
  }

  signInDemo(role: UserRole) : void{
    const user = DEMO_USERS[role];
    this.error.set(null);
    this.user.set(user);
    this.storage.write(STORAGE_KEYS.session, user);
  }

  async signOut(): Promise<void>{
    const wasGoogle =  this.user()?.provider === 'google';
    this.user.set(null);
    this.storage.remove(STORAGE_KEYS.session);
    if(wasGoogle && this.firebaseAuth){
      const {signOut} = await import('firebase/auth');
      await signOut(this.firebaseAuth).catch(() =>undefined);
    }
  }
}

function isAppUser(value: unknown): value is AppUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as AppUser).uid === 'string' &&
    typeof (value as AppUser).email === 'string'
  );
}

function isRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'customer';
}

export const DEMO_USERS = {
  customer: { uid: 'demo-customer', email: 'customer@demo.local', displayName: 'Demo Customer', photoUrl: null, provider: 'demo' },
  admin: { uid: 'demo-admin', email: 'admin@demo.local', displayName: 'Demo Admin', photoUrl: null, provider: 'demo' },
} as const satisfies Record<UserRole, AppUser>;


function describeAuthError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Allow popups for this site and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase. Add it under Authentication → Settings → Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled for this Firebase project.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

