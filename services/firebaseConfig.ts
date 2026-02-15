import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, OAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ==================================================================================
// ⚠️ TO ENABLE REAL GMAIL/GITHUB/APPLE LOGIN:
// 1. Go to https://console.firebase.google.com/
// 2. Create a project
// 3. Add a Web App and copy the config object below
// 4. Enable "Authentication" > "Sign-in method" > Google / GitHub / Apple
// ==================================================================================

const firebaseConfig = {
  // PASTE YOUR REAL KEYS HERE
  apiKey: "YOUR_FIREBASE_API_KEY_HERE",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

let auth: any = null;
let db: any = null;
let googleProvider: any = null;
let githubProvider: any = null;
let appleProvider: any = null;
export let isUsingMock = false;

// Check if keys are placeholders
const isConfigured = firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY_HERE";

if (isConfigured) {
    try {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        
        googleProvider = new GoogleAuthProvider();
        googleProvider.addScope('email');
        googleProvider.addScope('profile');

        githubProvider = new GithubAuthProvider();
        appleProvider = new OAuthProvider('apple.com');
    } catch (error) {
        console.warn("Firebase initialization failed (Check keys). Falling back to Demo Mode.", error);
        isUsingMock = true;
    }
} else {
    isUsingMock = true;
}

// --- Mock Login Generator ---
const mockLogin = async (providerName: string) => {
    console.log(`%c[Demo Mode] Logging in with ${providerName}... (Add Firebase keys to enable Real Login)`, "color: cyan; font-weight: bold;");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const avatar = providerName === 'GitHub' 
        ? 'https://ui-avatars.com/api/?name=Github+User&background=24292e&color=fff&bold=true'
        : providerName === 'Apple'
        ? 'https://ui-avatars.com/api/?name=Apple+User&background=000&color=fff&bold=true'
        : 'https://ui-avatars.com/api/?name=Google+User&background=4285F4&color=fff&bold=true';

    return {
        user: {
            uid: `demo_${providerName.toLowerCase()}_${Date.now()}`,
            displayName: `${providerName} User`,
            email: `user@${providerName.toLowerCase()}.com`,
            photoURL: avatar,
            emailVerified: true
        }
    };
};

export const signInWithGoogle = async () => {
    if (!auth) return mockLogin('Google');
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result;
    } catch (error: any) {
        console.error("Firebase Google Login Error:", error);
        if (error.code === 'auth/unauthorized-domain' || error.code === 'auth/api-key-not-valid') {
            alert("Firebase Error: Check your Domain whitelist and API Key in services/firebaseConfig.ts");
        }
        return mockLogin('Google');
    }
};

export const signInWithGithub = async () => {
    if (!auth) return mockLogin('GitHub');
    try {
        const result = await signInWithPopup(auth, githubProvider);
        return result;
    } catch (error) {
        console.error("Firebase GitHub Login Error:", error);
        return mockLogin('GitHub');
    }
};

export const signInWithApple = async () => {
    if (!auth) return mockLogin('Apple');
    try {
        const result = await signInWithPopup(auth, appleProvider);
        return result;
    } catch (error) {
        console.error("Firebase Apple Login Error:", error);
        return mockLogin('Apple');
    }
};

export const logout = async () => {
    if (auth) {
        await firebaseSignOut(auth);
    }
};

export { auth, db };