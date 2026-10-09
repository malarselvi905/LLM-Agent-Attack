export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface TestCase {
  id: string;
  title: string;
  category: string;
  learning_objective: string;
  input_template: string;
  expected_behavior: string;
  detection_criteria: string;
  remediation_guidance: string;
  difficulty: string;
  is_active: number;
  created_at: string;
}

export interface Assessment {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_mode: 'mock-vulnerable' | 'mock-hardened' | 'gemini';
  status: 'draft' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  creator_name?: string;
  total_tests?: number;
  passed_tests?: number;
  failed_tests?: number;
  findings_count?: number;
  high_risk_count?: number;
}

export interface AssessmentResult {
  id: string;
  assessment_id: string;
  test_case_id: string;
  test_title?: string;
  category?: string;
  difficulty?: string;
  learning_objective?: string;
  test_input: string;
  observed_output: string;
  expected_behavior: string;
  result_status: 'passed' | 'failed' | 'inconclusive';
  evaluation_method: string;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low' | 'Safe';
  findings_count: number;
  created_at: string;
}

export interface Finding {
  id: string;
  assessment_id: string;
  assessment_title?: string;
  result_id: string;
  category: string;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  evidence: string;
  potential_impact: string;
  remediation: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Accepted Risk';
  created_at: string;
  test_input?: string;
  observed_output?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

const TOKEN_KEY = 'dvla_auth_token';
const USER_KEY = 'dvla_auth_user';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: (): User | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user: User) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(USER_KEY),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    authStorage.clear();
    // Dispatch custom event so app re-renders to login without reload
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new Error('Session expired or unauthorized. Please log in.');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed with status ' + response.status);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: { name: string; email: string; password: string }) =>
    apiRequest<{ message: string; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    apiRequest<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    apiRequest<{ message: string }>('/api/auth/logout', { method: 'POST' }),

  getMe: () =>
    apiRequest<{ user: User }>('/api/auth/me'),

  changePassword: (payload: { current_password: string; new_password: string }) =>
    apiRequest<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Dashboard
  getDashboardSummary: () =>
    apiRequest<{
      summary: {
        total_assessments: number;
        total_tests: number;
        passed_tests: number;
        failed_tests: number;
        total_findings: number;
        critical_count: number;
        high_risk_count: number;
        medium_count: number;
        low_count: number;
      };
      category_distribution: Array<{ category: string; count: number }>;
      timeline: Array<{ date: string; total: number; passed: number; failed: number }>;
    }>('/api/dashboard/summary'),

  getDashboardActivity: () =>
    apiRequest<{
      recent_assessments: Assessment[];
      recent_findings: Finding[];
    }>('/api/dashboard/activity'),

  // Assessments
  getAssessments: () =>
    apiRequest<{ assessments: Assessment[] }>('/api/assessments'),

  createAssessment: (payload: {
    title: string;
    description?: string;
    target_mode: string;
    test_case_ids?: string[];
  }) =>
    apiRequest<{ message: string; assessment: Assessment }>('/api/assessments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAssessment: (id: string) =>
    apiRequest<{
      assessment: Assessment;
      results: AssessmentResult[];
      findings: Finding[];
    }>(`/api/assessments/${id}`),

  runAssessment: (id: string, testCaseIds?: string[]) =>
    apiRequest<{
      message: string;
      summary: {
        total_tests: number;
        passed_tests: number;
        failed_tests: number;
        findings_count: number;
        completed_at: string;
      };
    }>(`/api/assessments/${id}/run`, {
      method: 'POST',
      body: JSON.stringify({ test_case_ids: testCaseIds }),
    }),

  deleteAssessment: (id: string) =>
    apiRequest<{ message: string }>(`/api/assessments/${id}`, { method: 'DELETE' }),

  // Test Cases
  getTestCases: (params?: { category?: string; difficulty?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.difficulty) q.append('difficulty', params.difficulty);
    if (params?.search) q.append('search', params.search);
    return apiRequest<{ test_cases: TestCase[] }>(`/api/test-cases?${q.toString()}`);
  },

  createTestCase: (payload: Partial<TestCase>) =>
    apiRequest<{ message: string; test_case: TestCase }>('/api/test-cases', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTestCase: (id: string) =>
    apiRequest<{ test_case: TestCase }>(`/api/test-cases/${id}`),

  // Findings
  getFindings: (params?: { risk_level?: string; category?: string; status?: string; assessment_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.risk_level) q.append('risk_level', params.risk_level);
    if (params?.category) q.append('category', params.category);
    if (params?.status) q.append('status', params.status);
    if (params?.assessment_id) q.append('assessment_id', params.assessment_id);
    return apiRequest<{ findings: Finding[] }>(`/api/findings?${q.toString()}`);
  },

  getFinding: (id: string) =>
    apiRequest<{ finding: Finding }>(`/api/findings/${id}`),

  updateFindingStatus: (id: string, status: string) =>
    apiRequest<{ message: string; id: string; status: string }>(`/api/findings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Reports
  getAssessmentReport: (id: string) =>
    apiRequest<{ report: any }>(`/api/reports/${id}/report`),

  // Audit Logs
  getAuditLogs: (params?: { action?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.action) q.append('action', params.action);
    if (params?.limit) q.append('limit', String(params.limit));
    return apiRequest<{ audit_logs: AuditLog[] }>(`/api/audit-logs?${q.toString()}`);
  },

  // Admin
  getAdminUsers: () =>
    apiRequest<{ users: any[] }>('/api/admin/users'),

  updateAdminUserRole: (id: string, role: string) =>
    apiRequest<{ message: string; id: string; role: string }>(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  updateAdminUserStatus: (id: string, isActive: boolean) =>
    apiRequest<{ message: string; id: string; is_active: number }>(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    }),

  getAdminStats: () =>
    apiRequest<{ stats: any }>('/api/admin/system-stats'),

  resetSandbox: () =>
    apiRequest<{ message: string }>('/api/admin/reset-sandbox', { method: 'POST' }),

  // Playground single evaluation
  evaluateSingle: (payload: { category: string; test_input: string; expected_behavior?: string; target_mode: string }) =>
    apiRequest<{
      result: {
        observedOutput: string;
        resultStatus: 'passed' | 'failed' | 'inconclusive';
        evaluationMethod: string;
        riskLevel: 'Critical' | 'High' | 'Medium' | 'Low' | 'Safe';
        findings: Array<{
          category: string;
          riskLevel: string;
          description: string;
          evidence: string;
          potentialImpact: string;
          remediation: string;
        }>;
      };
    }>('/api/engine/evaluate-single', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
