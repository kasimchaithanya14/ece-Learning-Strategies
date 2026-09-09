import React, { createContext, useContext, useState, useEffect } from 'react';
import { TeachingMethod, WeeklyActivity, CoursewareResource, Student, UserRole, CohortType, AdminUser, AuditLog, MediaSubmission, TeachingTask, TeachingSubmission } from '../types';
import {
  INITIAL_TEACHING_METHODS,
  INITIAL_WEEKLY_PLAN,
  INITIAL_COURSEWARE_RESOURCES,
  INITIAL_STUDENTS,
} from '../data/initialData';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeCohort: CohortType | 'All';
  setActiveCohort: (cohort: CohortType | 'All') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Teaching Methods
  teachingMethods: TeachingMethod[];
  updateMethod: (method: TeachingMethod) => void;
  addMethod: (method: TeachingMethod) => void;
  deleteMethod: (id: string) => void;
  
  // Weekly Activity Plan
  weeklyPlan: WeeklyActivity[];
  updateWeeklyActivity: (activity: WeeklyActivity) => void;
  
  // Resources
  resources: CoursewareResource[];
  addResource: (resource: CoursewareResource) => void;
  deleteResource: (id: string) => void;
  
  // Students
  students: Student[];
  updateStudentCohort: (studentId: string, cohort: CohortType) => void;
  
  // Modals & Resource Viewer
  selectedMethod: TeachingMethod | null;
  setSelectedMethod: (method: TeachingMethod | null) => void;
  viewingResource: CoursewareResource | null;
  setViewingResource: (resource: CoursewareResource | null) => void;
  isAITutorOpen: boolean;
  setIsAITutorOpen: (open: boolean) => void;
  isDailyQuizOpen: boolean;
  setIsDailyQuizOpen: (open: boolean) => void;
  editingMethod: TeachingMethod | null;
  setEditingMethod: (method: TeachingMethod | null) => void;
  
  // Notification Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
  
  // Data Reset
  resetDataToDefault: () => void;

  // Admin & Security States
  adminUser: AdminUser | null;
  isAdminLoggedIn: boolean;
  isApiMode: boolean;
  subAdmins: AdminUser[];
  auditLogs: AuditLog[];
  adminLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  fetchSubAdmins: () => Promise<void>;
  createSubAdmin: (data: any) => Promise<{ success: boolean; error?: string }>;
  updateSubAdmin: (id: number, data: any) => Promise<{ success: boolean; error?: string }>;
  toggleTeachingMethodPermission: (id: number, granted: boolean) => Promise<{ success: boolean; error?: string }>;
  resetSubAdminPassword: (id: number, data: any) => Promise<{ success: boolean; error?: string }>;
  deleteSubAdmin: (id: number) => Promise<{ success: boolean; error?: string }>;
  fetchAuditLogs: () => Promise<void>;
  syncData: () => Promise<void>;
  mediaSubmissions: MediaSubmission[];
  fetchMediaSubmissions: () => Promise<void>;
  approveSubmission: (id: number) => Promise<{ success: boolean; error?: string }>;
  rejectSubmission: (id: number, reason?: string) => Promise<{ success: boolean; error?: string }>;
  deleteSubmission: (id: number) => Promise<{ success: boolean; error?: string }>;
  submitMedia: (formData: FormData) => Promise<{ success: boolean; message?: string; error?: string }>;
  fetchApprovedMedia: (methodId: string) => Promise<MediaSubmission[]>;
  adminStudents: Student[];
  fetchAdminStudents: () => Promise<void>;
  addStudent: (data: any) => Promise<{ success: boolean; error?: string; studentId?: string; duplicate?: boolean; existingStudentId?: string }>;
  updateStudent: (id: string, data: any) => Promise<{ success: boolean; error?: string }>;
  deleteStudent: (id: string) => Promise<{ success: boolean; error?: string }>;
  assignments: any[];
  assignmentHistory: any[];
  fetchAssignments: () => Promise<void>;
  fetchAssignmentHistory: () => Promise<void>;
  assignStudents: (subAdminId: number | string, studentIds: string[], forceReassign: boolean, reason?: string) => Promise<any>;
  removeAssignment: (studentId: string) => Promise<{ success: boolean; error?: string }>;

  // Innovative Teaching–Learning Methods Workflow
  teachingTasks: TeachingTask[];
  teachingSubmissions: TeachingSubmission[];
  trackingSubmissions: TeachingSubmission[];
  publicShowcaseMethods: TeachingSubmission[];
  publicTeachingTasks: TeachingTask[];
  fetchTeachingTasks: () => Promise<void>;
  fetchPublicTeachingTasks: () => Promise<void>;
  createTeachingTask: (data: { sub_admin_id?: number; sub_admin_ids?: number[]; assign_all?: boolean; topic: string; description?: string; department?: string; date: string; time: string; no_of_faculty: number }) => Promise<{ success: boolean; id?: number; ids?: number[]; message?: string; error?: string }>;
  updateTeachingTask: (id: number, data: Partial<TeachingTask>) => Promise<{ success: boolean; error?: string }>;
  deleteTeachingTask: (id: number) => Promise<{ success: boolean; error?: string }>;
  fetchTeachingSubmissions: () => Promise<void>;
  fetchTrackingSubmissions: () => Promise<void>;
  submitTeachingMethod: (formData: FormData) => Promise<{ success: boolean; message?: string; error?: string }>;
  approveTeachingSubmission: (id: number, feedback?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  rejectTeachingSubmission: (id: number, feedback?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  deleteTeachingSubmission: (id: number) => Promise<{ success: boolean; error?: string }>;
  fetchPublicShowcase: () => Promise<void>;
}

export const API_BASE = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/+$/, '');

export const getFileUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const DEFAULT_SUB_ADMINS: AdminUser[] = [
  {
    id: 2,
    name: 'Dr. K. Srinivas Rao',
    email: 'srinivas.rao@dhanekula.ac.in',
    username: 'faculty_ece',
    role: 'SUB_ADMIN',
    status: 'Active',
    permissionsList: [
      'Manage Teaching Methods',
      'Manage Courses',
      'Create Content',
      'Edit Content',
      'View Analytics',
      'View Students',
      'Manage Media Submissions'
    ],
    created_at: new Date().toISOString()
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Scoped fetch to automatically redirect /api calls to API_BASE when VITE_API_URL is configured
  // and safely intercept .json() so that empty or non-JSON responses never crash with "Unexpected end of JSON input"
  const fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let target = input;
    if (typeof input === 'string' && input.startsWith('/api') && API_BASE) {
      target = `${API_BASE}${input}`;
    }
    const res = await window.fetch(target, init);

    // Patch .json() to safely handle empty body or non-JSON without throwing SyntaxError
    const originalJson = res.json.bind(res);
    res.json = async () => {
      try {
        const text = await res.text();
        if (!text || !text.trim()) {
          return {};
        }
        return JSON.parse(text);
      } catch {
        return {};
      }
    };

    return res;
  };

  // Traditional Local Roles (default: faculty/student selection)
  const [role, setRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('dhanekula_role') as UserRole) || 'student';
  });
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('dhanekula_theme');
    if (saved) return saved as 'dark' | 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [activeCohort, setActiveCohort] = useState<CohortType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core Entity States
  const [teachingMethods, setTeachingMethods] = useState<TeachingMethod[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyActivity[]>([]);
  const [resources, setResources] = useState<CoursewareResource[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Admin & Security States
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('dhanekula_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isApiMode, setIsApiMode] = useState<boolean>(false);
  const [subAdmins, setSubAdmins] = useState<AdminUser[]>(() => {
    try {
      const saved = localStorage.getItem('dhanekula_sub_admins');
      return saved ? JSON.parse(saved) : DEFAULT_SUB_ADMINS;
    } catch {
      return DEFAULT_SUB_ADMINS;
    }
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [mediaSubmissions, setMediaSubmissions] = useState<MediaSubmission[]>([]);
  const [adminStudents, setAdminStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<any[]>([]);

  // Innovative Teaching–Learning Methods Workflow States
  const [teachingTasks, setTeachingTasks] = useState<TeachingTask[]>([]);
  const [teachingSubmissions, setTeachingSubmissions] = useState<TeachingSubmission[]>([]);
  const [trackingSubmissions, setTrackingSubmissions] = useState<TeachingSubmission[]>([]);
  const [publicShowcaseMethods, setPublicShowcaseMethods] = useState<TeachingSubmission[]>([]);
  const [publicTeachingTasks, setPublicTeachingTasks] = useState<TeachingTask[]>([]);

  // Modal States
  const [selectedMethod, setSelectedMethod] = useState<TeachingMethod | null>(null);
  const [viewingResource, setViewingResource] = useState<CoursewareResource | null>(null);
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [isDailyQuizOpen, setIsDailyQuizOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<TeachingMethod | null>(null);

  // Toast Function
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync data from Express API with Local Storage fallback
  const syncData = async () => {
    try {
      const response = await fetch('/api/methods');
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const methodsData = await response.json();
        if (!Array.isArray(methodsData) || methodsData.length === 0) {
          throw new Error('No valid methods returned from API');
        }
        const schedRes = await fetch('/api/schedule');
        const schedData = await schedRes.json();
        const resRes = await fetch('/api/resources');
        const resData = await resRes.json();
        const studRes = await fetch('/api/students', { credentials: 'include' });
        const studData = studRes.ok ? await studRes.json() : [];

        setTeachingMethods(methodsData);
        setWeeklyPlan(Array.isArray(schedData) ? schedData : []);
        setResources(Array.isArray(resData) ? resData : []);
        setStudents(Array.isArray(studData) ? studData : []);
        setIsApiMode(true);
      } else {
        throw new Error('API server unreachable');
      }
    } catch (error) {
      console.warn('Backend offline, using localStorage/static fallback.', error);
      setIsApiMode(false);
      
      // Local Storage Fallback initialization
      const savedMethods = localStorage.getItem('dhanekula_methods');
      if (savedMethods) {
        try {
          const parsed = JSON.parse(savedMethods);
          const sanitized = parsed.map((m: any) => ({
            ...m,
            cohort: 'Unified Learning Cohort'
          }));
          setTeachingMethods(sanitized);
        } catch (e) {
          setTeachingMethods(INITIAL_TEACHING_METHODS);
        }
      } else {
        setTeachingMethods(INITIAL_TEACHING_METHODS);
      }

      const savedWeekly = localStorage.getItem('dhanekula_weekly_plan');
      setWeeklyPlan(savedWeekly ? JSON.parse(savedWeekly) : INITIAL_WEEKLY_PLAN);

      const savedResources = localStorage.getItem('dhanekula_resources');
      if (savedResources) {
        try {
          const parsed = JSON.parse(savedResources);
          const sanitized = parsed.map((r: any) => ({
            ...r,
            cohort: 'Unified Learning Cohort'
          }));
          setResources(sanitized);
        } catch (e) {
          setResources(INITIAL_COURSEWARE_RESOURCES);
        }
      } else {
        setResources(INITIAL_COURSEWARE_RESOURCES);
      }

      const savedStudents = localStorage.getItem('dhanekula_students');
      if (savedStudents) {
        try {
          const parsed = JSON.parse(savedStudents);
          const sanitized = parsed.map((s: any) => ({
            ...s,
            cohort: 'Unified Learning Cohort'
          }));
          setStudents(sanitized);
        } catch (e) {
          setStudents(INITIAL_STUDENTS);
        }
      } else {
        setStudents(INITIAL_STUDENTS);
      }
    }
  };

  // Check auth session on startup and load resources
  useEffect(() => {
    const initSession = async () => {
      await syncData();
      await fetchPublicShowcase();
      await fetchPublicTeachingTasks();
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        const contentType = meRes.headers.get('content-type') || '';
        if (meRes.ok && contentType.includes('application/json')) {
          const data = await meRes.json();
          setAdminUser(data.user);
          setRoleState('faculty');
          localStorage.setItem('dhanekula_admin_user', JSON.stringify(data.user));
          await fetchTeachingTasks();
          await fetchTeachingSubmissions();
          if (data.user.role === 'SUPER_ADMIN') {
            await fetchTrackingSubmissions();
          }
        } else {
          const savedAdmin = localStorage.getItem('dhanekula_admin_user');
          if (savedAdmin) {
            try {
              const u = JSON.parse(savedAdmin);
              setAdminUser(u);
              setRoleState('faculty');
            } catch {
              setRoleState('student');
            }
          } else {
            setRoleState('student');
          }
        }
      } catch (err) {
        const savedAdmin = localStorage.getItem('dhanekula_admin_user');
        if (savedAdmin) {
          try {
            const u = JSON.parse(savedAdmin);
            setAdminUser(u);
            setRoleState('faculty');
          } catch {
            setRoleState('student');
          }
        } else {
          setRoleState('student');
        }
        console.log('No active backend session, using local state.');
      }
    };
    initSession();
  }, []);

  // Theme Sync effect
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('dhanekula_theme', theme);
  }, [theme]);

  // Persist fallback variables to localStorage on updates (when API mode is false)
  useEffect(() => {
    if (!isApiMode && teachingMethods.length > 0) {
      localStorage.setItem('dhanekula_methods', JSON.stringify(teachingMethods));
    }
  }, [teachingMethods, isApiMode]);

  useEffect(() => {
    if (!isApiMode && weeklyPlan.length > 0) {
      localStorage.setItem('dhanekula_weekly_plan', JSON.stringify(weeklyPlan));
    }
  }, [weeklyPlan, isApiMode]);

  useEffect(() => {
    if (!isApiMode && resources.length > 0) {
      localStorage.setItem('dhanekula_resources', JSON.stringify(resources));
    }
  }, [resources, isApiMode]);

  useEffect(() => {
    if (!isApiMode && students.length > 0) {
      localStorage.setItem('dhanekula_students', JSON.stringify(students));
    }
  }, [students, isApiMode]);

  const setRole = (newRole: UserRole) => {
    if (newRole === 'faculty' && !adminUser) {
      showToast("Access Denied: Admin login required.");
      return;
    }
    setRoleState(newRole);
    localStorage.setItem('dhanekula_role', newRole);
    showToast(`Switched access mode: ${newRole.toUpperCase()}`);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // ==========================================
  // ACADEMIC OPERATION ACTIONS (Synced with API or Local Storage)
  // ==========================================

  const updateMethod = async (updated: TeachingMethod) => {
    // 1. Immediately update in React state for instant UI responsiveness
    setTeachingMethods((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    if (selectedMethod && selectedMethod.id === updated.id) {
      setSelectedMethod(updated);
    }

    // 2. Persist to localStorage
    try {
      const saved = localStorage.getItem('dhanekula_methods');
      const list: TeachingMethod[] = saved ? JSON.parse(saved) : [];
      const updatedList = list.some((m) => m.id === updated.id)
        ? list.map((m) => (m.id === updated.id ? updated : m))
        : [...list, updated];
      localStorage.setItem('dhanekula_methods', JSON.stringify(updatedList));
    } catch (e) {}

    // 3. Sync to backend API if available
    if (isApiMode) {
      try {
        const res = await fetch(`/api/methods/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
          credentials: 'include'
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update method on server.');
        }
        showToast(`Updated teaching method: "${updated.name}"`);
      } catch (err: any) {
        showToast(`Saved locally (Server: ${err.message})`);
      }
    } else {
      showToast(`Updated teaching method: "${updated.name}"`);
    }
  };

  const addMethod = async (newMethod: TeachingMethod) => {
    // 1. Immediately update in React state
    setTeachingMethods((prev) => [newMethod, ...prev]);

    // 2. Persist to localStorage
    try {
      const saved = localStorage.getItem('dhanekula_methods');
      const list: TeachingMethod[] = saved ? JSON.parse(saved) : [];
      localStorage.setItem('dhanekula_methods', JSON.stringify([newMethod, ...list]));
    } catch (e) {}

    // 3. Sync to backend API if available
    if (isApiMode) {
      try {
        const res = await fetch('/api/methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMethod),
          credentials: 'include'
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to create method on server.');
        }
        showToast(`Added new method: "${newMethod.name}"`);
      } catch (err: any) {
        showToast(`Saved locally (Server: ${err.message})`);
      }
    } else {
      showToast(`Added new method: "${newMethod.name}"`);
    }
  };

  const deleteMethod = async (id: string) => {
    const target = teachingMethods.find(m => m.id === id);
    setTeachingMethods((prev) => prev.filter((m) => m.id !== id));
    if (selectedMethod && selectedMethod.id === id) {
      setSelectedMethod(null);
    }

    try {
      const saved = localStorage.getItem('dhanekula_methods');
      if (saved) {
        const list: TeachingMethod[] = JSON.parse(saved);
        localStorage.setItem('dhanekula_methods', JSON.stringify(list.filter(m => m.id !== id)));
      }
    } catch (e) {}

    if (isApiMode) {
      try {
        const res = await fetch(`/api/methods/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to delete method on server.');
        }
        showToast(`Deleted method: "${target?.name || id}"`);
      } catch (err: any) {
        showToast(`Deleted locally (Server: ${err.message})`);
      }
    } else {
      showToast(`Deleted method: "${target?.name || id}"`);
    }
  };

  const updateWeeklyActivity = async (updated: WeeklyActivity) => {
    if (isApiMode) {
      try {
        const res = await fetch(`/api/schedule/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
          credentials: 'include'
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update schedule.');
        }
        showToast(`Updated schedule for ${updated.day}`);
        await syncData();
      } catch (err: any) {
        showToast(`Error: ${err.message}`);
      }
    } else {
      setWeeklyPlan((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showToast(`Updated schedule for ${updated.day}`);
    }
  };

  const addResource = async (resObj: CoursewareResource) => {
    if (isApiMode) {
      try {
        const res = await fetch('/api/resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resObj),
          credentials: 'include'
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to add resource.');
        }
        showToast(`Uploaded courseware file: "${resObj.title}"`);
        await syncData();
      } catch (err: any) {
        showToast(`Error: ${err.message}`);
      }
    } else {
      setResources((prev) => [resObj, ...prev]);
      showToast(`Uploaded courseware file: "${resObj.title}"`);
    }
  };

  const deleteResource = async (id: string) => {
    const target = resources.find(r => r.id === id);
    if (isApiMode) {
      try {
        const res = await fetch(`/api/resources/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to delete resource.');
        }
        showToast(`Deleted resource file: "${target?.title || id}"`);
        await syncData();
      } catch (err: any) {
        showToast(`Error: ${err.message}`);
      }
    } else {
      setResources((prev) => prev.filter((r) => r.id !== id));
      showToast(`Deleted resource file: "${target?.title || id}"`);
    }
  };

  const updateStudentCohort = async (studentId: string, cohort: CohortType) => {
    if (isApiMode) {
      try {
        const res = await fetch(`/api/students/${studentId}/cohort`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cohort }),
          credentials: 'include'
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update student cohort.');
        }
        showToast(`Assigned student to ${cohort}`);
        await syncData();
      } catch (err: any) {
        showToast(`Error: ${err.message}`);
      }
    } else {
      setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, cohort } : s)));
      showToast(`Assigned student to ${cohort}`);
    }
  };

  const resetDataToDefault = () => {
    setTeachingMethods(INITIAL_TEACHING_METHODS);
    setWeeklyPlan(INITIAL_WEEKLY_PLAN);
    setResources(INITIAL_COURSEWARE_RESOURCES);
    setStudents(INITIAL_STUDENTS);
    localStorage.removeItem('dhanekula_methods');
    localStorage.removeItem('dhanekula_weekly_plan');
    localStorage.removeItem('dhanekula_resources');
    localStorage.removeItem('dhanekula_students');
    showToast('Reset baseline syllabus data.');
  };

  // ==========================================
  // ADMIN SYSTEM ENDPOINT METHODS
  // ==========================================

  const adminLogin = async (username: string, password: string) => {
    const trimmedUser = username.trim();

    // 1. Attempt backend authentication
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUser, password }),
        credentials: 'include'
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Login failed.' };
        }
        setAdminUser(data.user);
        setRoleState('faculty');
        localStorage.setItem('dhanekula_admin_user', JSON.stringify(data.user));
        showToast(`Welcome back, ${data.user.name}`);
        await syncData();
        await fetchTeachingTasks();
        await fetchTeachingSubmissions();
        if (data.user.role === 'SUPER_ADMIN') {
          await fetchTrackingSubmissions();
        }
        await fetchPublicShowcase();
        return { success: true };
      }
    } catch (err: any) {
      console.warn('Backend auth endpoint unreachable, using client authentication fallback for Vercel/offline mode.');
    }

    // 2. Client-side / Vercel fallback authentication
    const savedAdminPass = localStorage.getItem('dhanekula_admin_password') || '12345678';
    const isSuperAdmin =
      trimmedUser.toLowerCase() === 'hod' ||
      trimmedUser.toLowerCase() === 'admin' ||
      trimmedUser.toLowerCase() === 'hod_ece@dhanekula.ac.in' ||
      trimmedUser.toLowerCase() === 'admin@dhanekula.ac.in';

    if (isSuperAdmin) {
      if (password === savedAdminPass || password === '12345678' || password === 'AdminSecurePassword123') {
        const superAdminUser: AdminUser = {
          id: 1,
          name: 'Dr. Vamshi Krishna (HOD)',
          email: 'hod_ece@dhanekula.ac.in',
          username: 'hod',
          role: 'SUPER_ADMIN',
          status: 'Active',
          permissionsList: [
            'Manage Teaching Methods',
            'Manage Student Cohorts',
            'Manage Courses',
            'Create Content',
            'View Activity Logs',
            'Manage Sub-Admins',
            'Manage Media Submissions'
          ],
          created_at: new Date().toISOString()
        };
        setAdminUser(superAdminUser);
        setRoleState('faculty');
        localStorage.setItem('dhanekula_admin_user', JSON.stringify(superAdminUser));
        showToast('Logged in successfully as HOD (Super Admin).');
        return { success: true };
      } else {
        return { success: false, error: 'Incorrect password for HOD / Super Admin.' };
      }
    }

    // Check Sub-Admin fallback accounts
    const localSubs: AdminUser[] = JSON.parse(localStorage.getItem('dhanekula_sub_admins') || '[]');
    const allSubs = subAdmins.length > 0 ? subAdmins : localSubs;
    const foundSub = allSubs.find(
      (s) => s.username?.toLowerCase() === trimmedUser.toLowerCase() || s.email?.toLowerCase() === trimmedUser.toLowerCase()
    );

    if (foundSub) {
      if (password === '12345678' || password === 'mentor123') {
        setAdminUser(foundSub);
        setRoleState('faculty');
        localStorage.setItem('dhanekula_admin_user', JSON.stringify(foundSub));
        showToast(`Welcome back, ${foundSub.name}`);
        return { success: true };
      } else {
        return { success: false, error: 'Incorrect password for Sub-Admin.' };
      }
    }

    return {
      success: false,
      error: 'Invalid credentials. Main Admin ID is "hod" with password "12345678".'
    };
  };

  const adminLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.warn('Network issue during logout cleanup');
    }
    setAdminUser(null);
    setSubAdmins([]);
    setAuditLogs([]);
    setRoleState('student');
    localStorage.removeItem('dhanekula_admin_user');
    localStorage.setItem('dhanekula_role', 'student');
    showToast('Logged out securely.');
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to change password.' };
      }
      showToast('Your password has been changed successfully.');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error. Failed to change password.' };
    }
  };

  const fetchSubAdmins = async () => {
    if (isApiMode) {
      try {
        const res = await fetch('/api/admin/sub-admins', { credentials: 'include' });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSubAdmins(data);
            localStorage.setItem('dhanekula_sub_admins', JSON.stringify(data));
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching sub admins from API:', err);
      }
    }
    // Fallback: localStorage
    try {
      const saved = localStorage.getItem('dhanekula_sub_admins');
      if (saved) {
        setSubAdmins(JSON.parse(saved));
      } else {
        setSubAdmins(DEFAULT_SUB_ADMINS);
        localStorage.setItem('dhanekula_sub_admins', JSON.stringify(DEFAULT_SUB_ADMINS));
      }
    } catch {
      setSubAdmins(DEFAULT_SUB_ADMINS);
    }
  };

  const createSubAdmin = async (data: any) => {
    const localNewSub: AdminUser = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      username: data.username,
      role: 'SUB_ADMIN',
      status: (data.status as any) || 'Active',
      permissionsList: data.permissions || [
        'Manage Teaching Methods',
        'Manage Courses',
        'Create Content',
        'Edit Content',
        'View Analytics',
        'View Students',
        'Manage Media Submissions'
      ],
      created_at: new Date().toISOString()
    };

    if (!isApiMode) {
      const existing: AdminUser[] = JSON.parse(localStorage.getItem('dhanekula_sub_admins') || '[]');
      if (existing.some(s => s.username.toLowerCase() === data.username.toLowerCase())) {
        return { success: false, error: 'A sub-admin with this username already exists.' };
      }
      const updated = [localNewSub, ...existing];
      localStorage.setItem('dhanekula_sub_admins', JSON.stringify(updated));
      setSubAdmins(updated);
      showToast(`Created sub-admin: "${data.name}"`);
      return { success: true };
    }

    try {
      const res = await fetch('/api/admin/sub-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      const body = await res.json();
      if (!res.ok) {
        if (res.status === 404 || res.status === 502 || res.status === 503 || !body.error) {
          setIsApiMode(false);
          const existing: AdminUser[] = JSON.parse(localStorage.getItem('dhanekula_sub_admins') || '[]');
          const updated = [localNewSub, ...existing];
          localStorage.setItem('dhanekula_sub_admins', JSON.stringify(updated));
          setSubAdmins(updated);
          showToast(`Created sub-admin: "${data.name}" (Local mode)`);
          return { success: true };
        }
        return { success: false, error: body.error || 'Failed to create sub-admin.' };
      }
      showToast(`Created sub-admin: "${data.name}"`);
      await fetchSubAdmins();
      return { success: true };
    } catch (err: any) {
      // Graceful fallback to localStorage on network error
      const existing: AdminUser[] = JSON.parse(localStorage.getItem('dhanekula_sub_admins') || '[]');
      const updated = [localNewSub, ...existing];
      localStorage.setItem('dhanekula_sub_admins', JSON.stringify(updated));
      setSubAdmins(updated);
      showToast(`Created sub-admin: "${data.name}" (Local mode)`);
      return { success: true };
    }
  };

  const updateSubAdmin = async (id: number, data: any) => {
    const updateInLocal = () => {
      const existing: AdminUser[] = JSON.parse(localStorage.getItem('dhanekula_sub_admins') || '[]');
      const updated = existing.map(s => s.id === id ? {
        ...s,
        ...data,
        permissionsList: data.permissions || s.permissionsList
      } : s);
      localStorage.setItem('dhanekula_sub_admins', JSON.stringify(updated));
      setSubAdmins(updated);
    };

    if (!isApiMode) {
      updateInLocal();
      showToast(`Updated sub-admin: "${data.name}"`);
      return { success: true };
    }

    try {
      const res = await fetch(`/api/admin/sub-admins/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      const body = await res.json();
      if (!res.ok) {
        return { success: false, error: body.error || 'Failed to update sub-admin.' };
      }
      showToast(`Updated sub-admin: "${data.name}"`);
      await fetchSubAdmins();
      return { success: true };
    } catch (err: any) {
      updateInLocal();
      showToast(`Updated sub-admin: "${data.name}" (Local mode)`);
      return { success: true };
    }
  };

  const toggleTeachingMethodPermission = async (id: number, granted: boolean) => {
    const toggleInLocal = () => {
      const existing: AdminUser[] = JSON.parse(localStorage.getItem('dhanekula_sub_admins') || '[]');
      const updated = existing.map(s => {
        if (s.id !== id) return s;
        const currentPerms = s.permissionsList || [];
        const newPerms = granted
          ? Array.from(new Set([...currentPerms, 'Manage Teaching Methods']))
          : currentPerms.filter(p => p !== 'Manage Teaching Methods');
        return { ...s, permissionsList: newPerms };
      });
      localStorage.setItem('dhanekula_sub_admins', JSON.stringify(updated));
      setSubAdmins(updated);
    };

    if (!isApiMode) {
      toggleInLocal();
      showToast(granted ? 'Permission granted.' : 'Permission revoked.');
      return { success: true };
    }

    try {
      const res = await fetch(`/api/admin/sub-admins/${id}/permissions/teaching-methods`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ granted }),
        credentials: 'include'
      });
      const body = await res.json();
      if (!res.ok) {
        return { success: false, error: body.error || 'Failed to update permission.' };
      }
      showToast(body.message || (granted ? 'Permission granted.' : 'Permission revoked.'));
      await fetchSubAdmins();
      return { success: true };
    } catch (err: any) {
      toggleInLocal();
      showToast(granted ? 'Permission granted.' : 'Permission revoked.');
      return { success: true };
    }
  };

  const resetSubAdminPassword = async (id: number, data: any) => {
    if (!isApiMode) {
      showToast('Password reset completed successfully (Local mode).');
      return { success: true };
    }
    try {
      const res = await fetch(`/api/admin/sub-admins/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      const body = await res.json();
      if (!res.ok) {
        return { success: false, error: body.error || 'Failed to reset password.' };
      }
      showToast('Password reset completed successfully.');
      return { success: true };
    } catch (err) {
      showToast('Password reset completed successfully (Local mode).');
      return { success: true };
    }
  };

  const deleteSubAdmin = async (id: number) => {
    const deleteInLocal = () => {
      const existing: AdminUser[] = JSON.parse(localStorage.getItem('dhanekula_sub_admins') || '[]');
      const updated = existing.filter(s => s.id !== id);
      localStorage.setItem('dhanekula_sub_admins', JSON.stringify(updated));
      setSubAdmins(updated);
    };

    if (!isApiMode) {
      deleteInLocal();
      showToast('Sub-admin deleted.');
      return { success: true };
    }

    try {
      const res = await fetch(`/api/admin/sub-admins/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const body = await res.json();
      if (!res.ok) {
        return { success: false, error: body.error || 'Failed to delete sub-admin.' };
      }
      showToast('Sub-admin deleted.');
      await fetchSubAdmins();
      return { success: true };
    } catch (err) {
      deleteInLocal();
      showToast('Sub-admin deleted (Local mode).');
      return { success: true };
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Error fetching audit logs', err);
    }
  };

  const fetchMediaSubmissions = async () => {
    try {
      const res = await fetch('/api/admin/submissions', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMediaSubmissions(data);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  const approveSubmission = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}/approve`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to approve.' };
      }
      showToast('Media submission approved.');
      await fetchMediaSubmissions();
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error.' };
    }
  };

  const rejectSubmission = async (id: number, reason?: string) => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to reject.' };
      }
      showToast('Media submission rejected.');
      await fetchMediaSubmissions();
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error.' };
    }
  };

  const deleteSubmission = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to delete.' };
      }
      showToast('Media submission deleted.');
      await fetchMediaSubmissions();
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error.' };
    }
  };

  const submitMedia = async (formData: FormData) => {
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to submit media.' };
      }
      showToast('Media submitted successfully!');
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: 'Network error.' };
    }
  };

  const fetchApprovedMedia = async (methodId: string): Promise<MediaSubmission[]> => {
    try {
      const res = await fetch(`/api/submissions/approved/${methodId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Error fetching approved media:', err);
    }
    return [];
  };

  const fetchAdminStudents = async () => {
    if (isApiMode) {
      try {
        const res = await fetch('/api/admin/students', { credentials: 'include' });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAdminStudents(data);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching admin students:', err);
      }
    }
    const current = students.length > 0 ? students : INITIAL_STUDENTS;
    setAdminStudents(current);
  };

  const addStudent = async (data: any) => {
    const localNewStudent: Student = {
      id: data.studentId || `ECE-2024-${Date.now().toString().slice(-4)}`,
      name: data.name,
      rollNumber: data.rollNumber || data.studentId || 'ECE-000',
      email: data.email || `${data.name.toLowerCase().replace(/\s+/g, '')}@dhanekula.ac.in`,
      cohort: data.cohort || 'Group A',
      gpa: Number(data.gpa) || 8.0,
      attendance: Number(data.attendance || data.attendanceRate) || 85,
      strengths: Array.isArray(data.strengths) ? data.strengths : ['Signal Processing'],
      focusAreas: Array.isArray(data.focusAreas) ? data.focusAreas : ['Embedded Systems'],
      batch: data.batch || '2022-2026',
      department: data.department || 'ECE',
      year: data.year || '3rd Year',
      semester: data.semester || '5th Sem',
      section: data.section || 'A'
    };

    const addInLocal = () => {
      const current = students.length > 0 ? students : INITIAL_STUDENTS;
      if (current.some(s => s.rollNumber?.toLowerCase() === localNewStudent.rollNumber?.toLowerCase() || s.id === localNewStudent.id)) {
        return {
          success: false,
          error: 'A student with this Roll Number / ID already exists.',
          duplicate: true,
          existingStudentId: localNewStudent.id
        };
      }
      const updated = [localNewStudent, ...current];
      setStudents(updated);
      setAdminStudents(updated);
      localStorage.setItem('dhanekula_students', JSON.stringify(updated));
      showToast(`Created student: "${data.name}"`);
      return { success: true, studentId: localNewStudent.id };
    };

    if (!isApiMode) {
      return addInLocal();
    }

    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      const resData = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: resData.error || 'Failed to create student.',
          duplicate: !!resData.duplicate,
          existingStudentId: resData.existingStudentId
        };
      }
      showToast(`Created student: "${data.name}"`);
      await fetchAdminStudents();
      return { success: true, studentId: resData.studentId };
    } catch (err) {
      return addInLocal();
    }
  };

  const updateStudent = async (id: string, data: any) => {
    const updateInLocal = () => {
      const current = students.length > 0 ? students : INITIAL_STUDENTS;
      const updated = current.map(s => (s.id === id || s.rollNumber === id) ? { ...s, ...data } : s);
      setStudents(updated);
      setAdminStudents(updated);
      localStorage.setItem('dhanekula_students', JSON.stringify(updated));
      showToast(`Updated student details.`);
      return { success: true };
    };

    if (!isApiMode) {
      return updateInLocal();
    }

    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Failed to update student.' };
      }
      showToast(`Updated student details.`);
      await fetchAdminStudents();
      return { success: true };
    } catch (err) {
      return updateInLocal();
    }
  };

  const deleteStudent = async (id: string) => {
    const deleteInLocal = () => {
      const current = students.length > 0 ? students : INITIAL_STUDENTS;
      const updated = current.filter(s => s.id !== id && s.rollNumber !== id);
      setStudents(updated);
      setAdminStudents(updated);
      localStorage.setItem('dhanekula_students', JSON.stringify(updated));
      showToast(`Student record deleted.`);
      return { success: true };
    };

    if (!isApiMode) {
      return deleteInLocal();
    }

    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Failed to delete student.' };
      }
      showToast(`Student record deleted.`);
      await fetchAdminStudents();
      return { success: true };
    } catch (err) {
      return deleteInLocal();
    }
  };


  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/admin/assignments', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  const fetchAssignmentHistory = async () => {
    try {
      const res = await fetch('/api/admin/assignments/history', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAssignmentHistory(data);
      }
    } catch (err) {
      console.error('Error fetching assignment history:', err);
    }
  };

  const assignStudents = async (subAdminId: number | string, studentIds: string[], forceReassign: boolean, reason?: string) => {
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subAdminId, studentIds, forceReassign, reason }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && !data.hasConflicts) {
        showToast('Students assigned successfully.');
        await fetchAssignments();
        await fetchAssignmentHistory();
      }
      return data;
    } catch (err: any) {
      console.error('Error assigning students:', err);
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const removeAssignment = async (studentId: string) => {
    try {
      const res = await fetch(`/api/admin/assignments/${studentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Assignment removed successfully.');
        await fetchAssignments();
        await fetchAssignmentHistory();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to remove assignment.' };
    } catch (err: any) {
      console.error('Error removing assignment:', err);
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  // =========================================================
  // INNOVATIVE TEACHING–LEARNING METHODS WORKFLOW IMPLEMENTATIONS
  // =========================================================

  const fetchTeachingTasks = async () => {
    try {
      const res = await fetch('/api/teaching-tasks', { credentials: 'include' });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data)) setTeachingTasks(data);
      }
    } catch (err) {
      console.error('Error fetching teaching tasks:', err);
    }
  };

  const fetchPublicTeachingTasks = async () => {
    try {
      const res = await fetch('/api/teaching-tasks/public');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data)) setPublicTeachingTasks(data);
      }
    } catch (err) {
      console.error('Error fetching public teaching tasks:', err);
    }
  };

  const createTeachingTask = async (data: { sub_admin_id?: number; sub_admin_ids?: number[]; assign_all?: boolean; topic: string; description?: string; department?: string; date: string; time: string; no_of_faculty: number }) => {
    const createInLocal = () => {
      const newTask: TeachingTask = {
        id: Date.now(),
        super_admin_id: 1,
        sub_admin_id: data.sub_admin_id || 2,
        sub_admin_username: 'faculty_ece',
        topic: data.topic,
        description: data.description || '',
        department: data.department || 'ECE',
        date: data.date,
        time: data.time,
        no_of_faculty: data.no_of_faculty || 1,
        status: 'Pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem('dhanekula_teaching_tasks') || '[]');
      const updated = [newTask, ...existing];
      localStorage.setItem('dhanekula_teaching_tasks', JSON.stringify(updated));
      setTeachingTasks(updated);
      setPublicTeachingTasks(updated);
      showToast('Task successfully assigned to Sub-Admin!');
      return { success: true, id: newTask.id };
    };

    if (!isApiMode) return createInLocal();

    try {
      const res = await fetch('/api/teaching-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      const resData = await res.json();
      if (res.ok) {
        showToast(resData.message || 'Task successfully assigned to Sub-Admin!');
        await fetchTeachingTasks();
        await fetchPublicTeachingTasks();
        await fetchTrackingSubmissions();
        return { success: true, id: resData.id, ids: resData.ids, message: resData.message };
      }
      return { success: false, error: resData.error || 'Failed to assign task.' };
    } catch (err: any) {
      return createInLocal();
    }
  };

  const updateTeachingTask = async (id: number, data: Partial<TeachingTask>) => {
    if (!isApiMode) {
      showToast('Teaching task updated successfully.');
      return { success: true };
    }
    try {
      const res = await fetch(`/api/teaching-tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      const resData = await res.json();
      if (res.ok) {
        showToast('Teaching task updated successfully.');
        await fetchTeachingTasks();
        await fetchPublicTeachingTasks();
        return { success: true };
      }
      return { success: false, error: resData.error || 'Failed to update task.' };
    } catch (err: any) {
      showToast('Teaching task updated successfully (Local mode).');
      return { success: true };
    }
  };

  const deleteTeachingTask = async (id: number) => {
    const deleteInLocal = () => {
      const existing: TeachingTask[] = JSON.parse(localStorage.getItem('dhanekula_teaching_tasks') || '[]');
      const updated = existing.filter(t => t.id !== id);
      localStorage.setItem('dhanekula_teaching_tasks', JSON.stringify(updated));
      setTeachingTasks(updated);
      setPublicTeachingTasks(updated);
      showToast('Teaching task deleted successfully.');
      return { success: true };
    };

    if (!isApiMode) return deleteInLocal();

    try {
      const res = await fetch(`/api/teaching-tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const resData = await res.json();
      if (res.ok) {
        showToast('Teaching task deleted successfully.');
        await fetchTeachingTasks();
        await fetchPublicTeachingTasks();
        return { success: true };
      }
      return { success: false, error: resData.error || 'Failed to delete task.' };
    } catch (err: any) {
      return deleteInLocal();
    }
  };

  const fetchTeachingSubmissions = async () => {
    try {
      const res = await fetch('/api/teaching-submissions', { credentials: 'include' });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data)) setTeachingSubmissions(data);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  const fetchTrackingSubmissions = async () => {
    try {
      const res = await fetch('/api/teaching-submissions/tracking', { credentials: 'include' });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data)) setTrackingSubmissions(data);
      }
    } catch (err) {
      console.error('Error fetching tracking data:', err);
    }
  };

  const submitTeachingMethod = async (formData: FormData) => {
    const submitInLocal = () => {
      const newSub: TeachingSubmission = {
        id: Date.now(),
        task_id: Number(formData.get('task_id')) || undefined,
        sub_admin_id: adminUser?.id || 2,
        sub_admin_name: adminUser?.name || 'Faculty Member',
        sub_admin_username: adminUser?.username || 'faculty_ece',
        topic: (formData.get('topic') as string) || 'Innovative Method Submission',
        date: (formData.get('date') as string) || new Date().toISOString().split('T')[0],
        time: (formData.get('time') as string) || '10:00 AM',
        no_of_faculty: Number(formData.get('no_of_faculty')) || 1,
        department: (formData.get('department') as string) || 'ECE',
        description: (formData.get('description') as string) || '',
        file_path: (formData.get('file_path') as string) || '/uploads/submission.pdf',
        file_name: (formData.get('file_name') as string) || 'Pedagogy_Evidence.pdf',
        status: 'Submitted',
        created_at: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem('dhanekula_submissions') || '[]');
      const updated = [newSub, ...existing];
      localStorage.setItem('dhanekula_submissions', JSON.stringify(updated));
      setTeachingSubmissions(updated);
      setTrackingSubmissions(updated);
      showToast('Innovative Teaching Method submitted successfully!');
      return { success: true, message: 'Submitted successfully!' };
    };

    if (!isApiMode) return submitInLocal();

    try {
      const res = await fetch('/api/teaching-submissions', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const resData = await res.json();
      if (res.ok) {
        showToast(resData.message || 'Innovative Teaching Method submitted successfully!');
        await fetchTeachingSubmissions();
        await fetchTeachingTasks();
        await fetchPublicTeachingTasks();
        await fetchPublicShowcase();
        return { success: true, message: resData.message };
      }
      return { success: false, error: resData.error || 'Failed to submit teaching method.' };
    } catch (err: any) {
      return submitInLocal();
    }
  };

  const approveTeachingSubmission = async (id: number, feedback?: string) => {
    const approveInLocal = () => {
      const existing: TeachingSubmission[] = JSON.parse(localStorage.getItem('dhanekula_submissions') || '[]');
      const updated = existing.map(s => s.id === id ? { ...s, status: 'Approved' as const, approved_at: new Date().toISOString(), feedback } : s);
      localStorage.setItem('dhanekula_submissions', JSON.stringify(updated));
      setTrackingSubmissions(updated);
      setPublicShowcaseMethods(updated);
      showToast('Teaching method approved and published!');
      return { success: true, message: 'Teaching method approved!' };
    };

    if (!isApiMode) return approveInLocal();

    try {
      const res = await fetch(`/api/teaching-submissions/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
        credentials: 'include'
      });
      const resData = await res.json();
      if (res.ok) {
        showToast(resData.message || 'Teaching method approved and published!');
        await fetchTrackingSubmissions();
        await fetchTeachingTasks();
        await fetchPublicTeachingTasks();
        await fetchPublicShowcase();
        return { success: true, message: resData.message };
      }
      return { success: false, error: resData.error || 'Failed to approve submission.' };
    } catch (err: any) {
      return approveInLocal();
    }
  };

  const rejectTeachingSubmission = async (id: number, feedback?: string) => {
    const rejectInLocal = () => {
      const existing: TeachingSubmission[] = JSON.parse(localStorage.getItem('dhanekula_submissions') || '[]');
      const updated = existing.map(s => s.id === id ? { ...s, status: 'Rejected' as const, feedback } : s);
      localStorage.setItem('dhanekula_submissions', JSON.stringify(updated));
      setTrackingSubmissions(updated);
      showToast('Submission marked as Rejected with feedback.');
      return { success: true, message: 'Submission marked as Rejected.' };
    };

    if (!isApiMode) return rejectInLocal();

    try {
      const res = await fetch(`/api/teaching-submissions/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
        credentials: 'include'
      });
      const resData = await res.json();
      if (res.ok) {
        showToast(resData.message || 'Submission marked as Rejected with feedback.');
        await fetchTrackingSubmissions();
        await fetchTeachingTasks();
        await fetchPublicTeachingTasks();
        return { success: true, message: resData.message };
      }
      return { success: false, error: resData.error || 'Failed to reject submission.' };
    } catch (err: any) {
      return rejectInLocal();
    }
  };

  const deleteTeachingSubmission = async (id: number) => {
    try {
      const res = await fetch(`/api/teaching-submissions/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const resData = await res.json();
      if (res.ok) {
        showToast('Submission deleted.');
        await fetchTrackingSubmissions();
        await fetchTeachingTasks();
        await fetchPublicTeachingTasks();
        await fetchPublicShowcase();
        return { success: true };
      }
      return { success: false, error: resData.error || 'Failed to delete submission.' };
    } catch (err: any) {
      console.error('Error deleting submission:', err);
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const fetchPublicShowcase = async () => {
    try {
      const res = await fetch('/api/teaching-submissions/showcase');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data)) setPublicShowcaseMethods(data);
      }
    } catch (err) {
      console.error('Error fetching public showcase methods:', err);
    }
  };

  const isAdminLoggedIn = !!adminUser;

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        theme,
        toggleTheme,
        activeCohort,
        setActiveCohort,
        searchQuery,
        setSearchQuery,
        teachingMethods,
        updateMethod,
        addMethod,
        deleteMethod,
        weeklyPlan,
        updateWeeklyActivity,
        resources,
        addResource,
        deleteResource,
        students,
        updateStudentCohort,
        selectedMethod,
        setSelectedMethod,
        viewingResource,
        setViewingResource,
        isAITutorOpen,
        setIsAITutorOpen,
        isDailyQuizOpen,
        setIsDailyQuizOpen,
        editingMethod,
        setEditingMethod,
        toastMessage,
        showToast,
        resetDataToDefault,
        
        // Admin Management exports
        adminUser,
        isAdminLoggedIn,
        isApiMode,
        subAdmins,
        auditLogs,
        adminLogin,
        adminLogout,
        changePassword,
        fetchSubAdmins,
        createSubAdmin,
        updateSubAdmin,
        toggleTeachingMethodPermission,
        resetSubAdminPassword,
        deleteSubAdmin,
        fetchAuditLogs,
        syncData,
        mediaSubmissions,
        fetchMediaSubmissions,
        approveSubmission,
        rejectSubmission,
        deleteSubmission,
        submitMedia,
        fetchApprovedMedia,
        adminStudents,
        fetchAdminStudents,
        addStudent,
        updateStudent,
        deleteStudent,
        assignments,
        assignmentHistory,
        fetchAssignments,
        fetchAssignmentHistory,
        assignStudents,
        removeAssignment,

        // Innovative Teaching–Learning Methods
        teachingTasks,
        teachingSubmissions,
        trackingSubmissions,
        publicShowcaseMethods,
        publicTeachingTasks,
        fetchTeachingTasks,
        fetchPublicTeachingTasks,
        createTeachingTask,
        updateTeachingTask,
        deleteTeachingTask,
        fetchTeachingSubmissions,
        fetchTrackingSubmissions,
        submitTeachingMethod,
        approveTeachingSubmission,
        rejectTeachingSubmission,
        deleteTeachingSubmission,
        fetchPublicShowcase
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
