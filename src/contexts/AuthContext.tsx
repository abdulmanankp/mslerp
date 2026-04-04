import { createContext, useCallback, useEffect, useState, ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/integrations/firebase/client";
import type { AppUserPermissions, AppUserProfile } from "@/types";

interface AppAuthError {
  message: string;
}

interface AuthContextType {
  session: User | null;
  user: User | null;
  userRole: string | null;
  userProfile: AppUserProfile | null;
  userPermissions: AppUserPermissions | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AppAuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AppAuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AppAuthError | null }>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

const DEFAULT_USER_PERMISSIONS: AppUserPermissions = {
  appAccess: false,
  canAddDistrictData: false,
  canEditDistrictData: false,
  canCreateMeetings: false,
  canManageUsers: false,
  canCreateUniversityMeetings: false,
  canManageUniversityRecords: false,
  canManageUniversityCampaigns: false,
  canMonitorUniversityAnalytics: false,
  canExportUniversityReports: false,
  assignedDistrictIds: [],
};

export function AuthProvider({ children }: { children: ReactNode }) {

  const [session, setSession] = useState<User | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [userPermissions, setUserPermissions] = useState<AppUserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const snap = await getDoc(doc(firestore, "user_roles", userId));
      const data = snap.exists() ? snap.data() : null;
      setUserRole(typeof data?.role === "string" ? data.role : null);

    } catch {
      setUserRole(null);
    }
  }, []);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const snap = await getDoc(doc(firestore, "users", userId));
      if (!snap.exists()) {
        setUserProfile(null);
        return;
      }

      const data = snap.data() as Partial<AppUserProfile> & { id?: string };
      setUserProfile({
        id: snap.id,
        email: typeof data.email === "string" ? data.email : "",
        fullName: typeof data.fullName === "string" ? data.fullName : "User",
        phone: typeof data.phone === "string" ? data.phone : undefined,
        profilePhotoUrl: typeof data.profilePhotoUrl === "string" ? data.profilePhotoUrl : null,
        designation: (typeof data.designation === "string" ? data.designation : "Viewer") as AppUserProfile["designation"],
        status: data.status === "Inactive" ? "Inactive" : "Active",
        createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
        createdBy: typeof data.createdBy === "string" ? data.createdBy : undefined,
        updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined,
      });
    } catch {
      setUserProfile(null);
    }
  }, []);

  const fetchUserPermissions = useCallback(async (userId: string) => {
    try {
      const snap = await getDoc(doc(firestore, "user_permissions", userId));
      if (!snap.exists()) {
        setUserPermissions(DEFAULT_USER_PERMISSIONS);
        return;
      }
      const data = snap.data() as Partial<AppUserPermissions>;
      setUserPermissions({
        appAccess: !!data.appAccess,
        canAddDistrictData: !!data.canAddDistrictData,
        canEditDistrictData: !!data.canEditDistrictData,
        canCreateMeetings: !!data.canCreateMeetings,
        canManageUsers: !!data.canManageUsers,
        canCreateUniversityMeetings: !!data.canCreateUniversityMeetings,
        canManageUniversityRecords: !!data.canManageUniversityRecords,
        canManageUniversityCampaigns: !!data.canManageUniversityCampaigns,
        canMonitorUniversityAnalytics: !!data.canMonitorUniversityAnalytics,
        canExportUniversityReports: !!data.canExportUniversityReports,
        assignedDistrictIds: Array.isArray(data.assignedDistrictIds) ? data.assignedDistrictIds : [],
      });
    } catch {
      setUserPermissions(DEFAULT_USER_PERMISSIONS);
    }
  }, []);

  const seedDefaultUserAccess = async (userId: string, email: string | null, fullName?: string | null) => {
    const existingUser = await getDoc(doc(firestore, "users", userId));
    if (existingUser.exists()) return;

    const now = new Date().toISOString();
    const inferredName = fullName || email?.split("@")[0] || "New User";

    await setDoc(doc(firestore, "users", userId), {
      userId,
      email: email || null,
      fullName: inferredName,
      phone: null,
      profilePhotoUrl: null,
      designation: "Viewer",
      status: "Active",
      createdAt: now,
      updatedAt: now,
    }, { merge: true });

    await setDoc(doc(firestore, "user_roles", userId), {
      userId,
      role: "user",
      updatedAt: now,
    }, { merge: true });

    await setDoc(doc(firestore, "user_designations", userId), {
      userId,
      designation: "Viewer",
      updatedAt: now,
    }, { merge: true });

    await setDoc(doc(firestore, "user_permissions", userId), {
      userId,
      appAccess: false,
      canAddDistrictData: false,
      canEditDistrictData: false,
      canCreateMeetings: false,
      canManageUsers: false,
      canCreateUniversityMeetings: false,
      canManageUniversityRecords: false,
      canManageUniversityCampaigns: false,
      canMonitorUniversityAnalytics: false,
      canExportUniversityReports: false,
      assignedDistrictIds: [],
      updatedAt: now,
    }, { merge: true });
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setSession(currentUser ?? null);
      setUser(currentUser ?? null);

      if (currentUser) {
        await fetchUserRole(currentUser.uid);
        await fetchUserProfile(currentUser.uid);
        await fetchUserPermissions(currentUser.uid);
      } else {
        setUserRole(null);
        setUserProfile(null);
        setUserPermissions(null);
      }

      setLoading(false);
    });

    return () => {
      unsub();
    };

  }, [fetchUserPermissions, fetchUserProfile, fetchUserRole]);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";
      return { error: { message } };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await seedDefaultUserAccess(credential.user.uid, credential.user.email, credential.user.displayName);
      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign up failed.";
      return { error: { message } };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(firebaseAuth, provider);
      await seedDefaultUserAccess(credential.user.uid, credential.user.email, credential.user.displayName);
      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google login failed.";
      return { error: { message } };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(firebaseAuth);

    setSession(null);
    setUser(null);
    setUserRole(null);
    setUserProfile(null);
    setUserPermissions(null);
  };

  const refreshUserProfile = async () => {
    if (!user?.uid) return;
    await fetchUserRole(user.uid);
    await fetchUserProfile(user.uid);
    await fetchUserPermissions(user.uid);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userRole,
        userProfile,
        userPermissions,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
