// Cloud sync through Firebase (Google sign-in + Firestore).
// Local storage stays the main copy so the app works offline; this file mirrors it to the cloud.
// Loaded on demand by app.js, so a failure here (e.g. no internet) never stops the app.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, deleteDoc, onSnapshot, getDocs,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyA-8iuQK1NwxrAG_xFvyog3SASkP98Gn8Q',
  authDomain: 'life-tracker-12167.firebaseapp.com',
  projectId: 'life-tracker-12167',
  storageBucket: 'life-tracker-12167.firebasestorage.app',
  messagingSenderId: '722165437532',
  appId: '1:722165437532:web:2e7616836b264cf92b8299',
};

const LT = window.LT;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let db;
try {
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch (e) {
  db = initializeFirestore(app, {}); // e.g. private browsing: no offline cache, still syncs while online
}

let uid = null;
let stopDays = null;
let stopSettings = null;
let serverSeen = false;

const dayRef = (k) => doc(db, 'users', uid, 'days', k);
const settingsRef = () => doc(db, 'users', uid, 'meta', 'settings');
const daysRef = () => collection(db, 'users', uid, 'days');

function state(s, error) {
  LT.syncState = { state: s, email: (auth.currentUser && auth.currentUser.email) || '', error: error || '' };
  LT.onSyncState();
}

/* ---------- Push local changes up ---------- */
let flushing = false;
async function flush() {
  if (!uid || flushing) return;
  flushing = true;
  try {
    let dirty = LT.getDirty();
    if (dirty.includes('@replace')) {
      // a backup was restored: remove cloud days that are not in it
      const remote = await getDocs(daysRef());
      const days = LT.state().days;
      await Promise.all(remote.docs.filter((d) => !days[d.id]).map((d) => deleteDoc(d.ref)));
      LT.clearDirty('@replace');
      dirty = LT.getDirty();
    }
    if (dirty.length) state('syncing');
    await Promise.all(dirty.map(async (k) => {
      if (k === '@settings') {
        await setDoc(settingsRef(), LT.state().settings);
      } else {
        const d = LT.state().days[k];
        await (d ? setDoc(dayRef(k), d) : deleteDoc(dayRef(k)));
      }
      LT.clearDirty(k);
    }));
    if (!LT.getDirty().length) state('synced');
  } catch (e) {
    console.warn('Sync push failed', e);
    state('error', 'Could not reach the cloud. Will retry.');
  } finally {
    flushing = false;
  }
}

/* ---------- Pull cloud changes down ---------- */
function startListeners() {
  const firstKey = 'lt.synced.' + uid;
  const days = () => LT.state().days;

  stopDays = onSnapshot(daysRef(), { includeMetadataChanges: true }, (snap) => {
    let changed = false;
    const remote = {};
    snap.docs.forEach((d) => { remote[d.id] = d.data(); });

    // days that exist in the cloud: newer copy wins
    for (const k in remote) {
      const local = days()[k];
      if (!local || (remote[k].u || 0) > (local.u || 0)) { days()[k] = remote[k]; changed = true; }
    }
    // days someone deleted on another device
    snap.docChanges().forEach((c) => {
      if (c.type === 'removed' && !c.doc.metadata.hasPendingWrites && days()[c.doc.id]) { delete days()[c.doc.id]; changed = true; }
    });

    // once the server has answered, do the one-time upload of this device's history
    if (!serverSeen && !snap.metadata.fromCache) {
      serverSeen = true;
      let seen = null;
      try { seen = localStorage.getItem(firstKey); } catch (e) { /* ignore */ }
      if (!seen) {
        const now = Date.now();
        for (const k in days()) {
          if (!remote[k] || (days()[k].u || 0) > (remote[k].u || 0)) {
            if (!days()[k].u) days()[k].u = now;
            LT.markDirty(k);
          }
        }
        try { localStorage.setItem(firstKey, '1'); } catch (e) { /* ignore */ }
      }
      flush();
    }

    if (changed) { LT.persist(); LT.render(); }
    if (!LT.getDirty().length && serverSeen) state('synced');
  }, (e) => { console.warn('Sync listen failed', e); state('error', 'Could not reach the cloud.'); });

  stopSettings = onSnapshot(settingsRef(), (snap) => {
    const s = LT.state().settings;
    if (snap.exists()) {
      const r = snap.data();
      if ((r.u || 0) > (s.u || 0)) { Object.assign(s, r); LT.persist(); LT.render(); }
    } else if (s.u) {
      LT.markDirty('@settings');
    }
  });
}

function stopListeners() {
  if (stopDays) stopDays();
  if (stopSettings) stopSettings();
  stopDays = stopSettings = null;
  serverSeen = false;
}

/* ---------- Sign in / out ---------- */
async function signIn() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
    } else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
      state('signedout', 'Sign-in failed (' + (e.code || 'error') + ')');
      LT.toast('Sign-in failed. Try again.');
    }
  }
}

async function logOut() {
  await signOut(auth); // data stays on this device
}

getRedirectResult(auth).catch((e) => { LT.toast('Sign-in failed (' + (e.code || 'error') + ')'); });

onAuthStateChanged(auth, (user) => {
  stopListeners();
  if (user) {
    uid = user.uid;
    state('syncing');
    startListeners();
  } else {
    uid = null;
    state('signedout');
  }
});

LT.sync = { flush, signIn, signOut: logOut };
state('signedout');
