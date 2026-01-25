import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useAnalytics } from '../composables/useAnalytics';
import DashboardView from '../views/DashboardView.vue';

// Lazy load views for better performance
const TransactionsView = () => import('../views/TransactionsView.vue');
const SettingsView = () => import('../views/SettingsView.vue');
const SpendingAnalysisView = () => import('../views/SpendingAnalysisView.vue');
const BudgetManagerView = () => import('../views/BudgetManagerView.vue');
const InstallmentPlansView = () => import('../views/InstallmentPlansView.vue');
const SubscriptionsView = () => import('../views/SubscriptionsView.vue');
const ReportsView = () => import('../views/ReportsView.vue');
const LoginView = () => import('../views/LoginView.vue');
const ForgotPasswordView = () => import('../views/ForgotPasswordView.vue');
const ResetPasswordView = () => import('../views/ResetPasswordView.vue');
const TermsOfService = () => import('../views/TermsOfServiceView.vue');
const AppPrivacy = () => import('../views/AppPrivacyView.vue');

const routes = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: TransactionsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/spending_analysis',
    name: 'SpendingAnalysis',
    component: SpendingAnalysisView,
    meta: { requiresAuth: true }
  },
  {
    path: '/budget_manager',
    name: 'BudgetManager',
    component: BudgetManagerView,
    meta: { requiresAuth: true }
  },
  {
    path: '/installment_plans',
    name: 'InstallmentPlans',
    component: InstallmentPlansView,
    meta: { requiresAuth: true }
  },
  {
    path: '/subscriptions',
    name: 'Subscriptions',
    component: SubscriptionsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: ReportsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { guestOnly: true, hideNavbar: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPasswordView,
    meta: { guestOnly: true, hideNavbar: true }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPasswordView,
    meta: { guestOnly: true, hideNavbar: true }
  },
  {
    path: '/terms',
    name: 'Terms',
    component: TermsOfService,
    meta: { hideNavbar: true }
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: AppPrivacy,
    meta: { hideNavbar: true }
  },
  {
    path: '/',
    redirect: '/dashboard'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const { trackPageView } = useAnalytics();

router.afterEach((to) => {
  if (to.name) {
    trackPageView(to.name.toString());
  }
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Ensure auth is initialized
  if (!authStore.authReady) {
    await authStore.init();
  }

  const user = authStore.user;
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const guestOnly = to.matched.some(record => record.meta.guestOnly);

  if (requiresAuth && !user) {
    next('/login');
  } else if (guestOnly && user) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;