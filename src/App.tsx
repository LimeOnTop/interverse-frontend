import ProTrialPage from './pages/ProTrialPage'
import AnalyticsTracker from './components/AnalyticsTracker'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { lazy, Suspense, useEffect } from 'react'

// Pages
import HomePage from './pages/HomePage'
import { preparations, jobTracks } from './data/preparation'
import { pythonPreparation } from './data/pythonPreparation'
const PricingPage = lazy(() => import('./pages/PricingPage'))
const PreparationPage = lazy(() => import('./pages/PreparationPythonPage'))
const PublicJobsPage = lazy(() => import('./pages/PublicJobsPage'))
const PublicCatalogPage = lazy(() => import('./pages/PublicCatalogPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const ContractorPage = lazy(() => import('./pages/ContractorPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const SystemDesignPage = lazy(() => import('./features/system-design/SystemDesignPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ActivityPage = lazy(() => import('./pages/ActivityPage'))
const InterviewWizardPage = lazy(() => import('./pages/InterviewWizardPage'))
const EditInterviewPage = lazy(() => import('./pages/EditInterviewPage'))
const EditInterviewFullPage = lazy(() => import('./pages/EditInterviewFullPage'))
const InterviewServicePage = lazy(() => import('./pages/InterviewServicePage'))
const InterviewPage = lazy(() => import('./pages/InterviewPage'))
const VacanciesPage = lazy(() => import('./pages/VacanciesPage'))
const TracksPage = lazy(() => import('./pages/TracksPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const ReportDetailPage = lazy(() => import('./pages/ReportDetailPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'))
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'))
const PaymentFailPage = lazy(() => import('./pages/PaymentFailPage'))
const ContributeQuestionPage = lazy(() => import('./pages/ContributeQuestionPage'))
const SupportPage = lazy(() => import('./pages/SupportPage'))
const SupportTicketPage = lazy(() => import('./pages/SupportTicketPage'))
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage'))
const AdminStatsPage = lazy(() => import('./pages/admin/AdminStatsPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminQuestionsPage = lazy(() => import('./pages/admin/AdminQuestionsPage'))
const AdminQuestionDetailPage = lazy(() => import('./pages/admin/AdminQuestionDetailPage'))
const AdminModerationPage = lazy(() => import('./pages/admin/AdminModerationPage'))
const AdminSupportPage = lazy(() => import('./pages/admin/AdminSupportPage'))
const AdminSupportTicketPage = lazy(() => import('./pages/admin/AdminSupportTicketPage'))
const GrafanaLoginPage = lazy(() => import('./pages/GrafanaLoginPage'))

// Components
const ResumeTrainingPage = lazy(() => import('./pages/ResumeTrainingPage'))

import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import { ThemeProvider } from './contexts/ThemeContext'
import SeoHead from './components/SeoHead'
import TrainingLimitPromo from './components/TrainingLimitPromo'

function App() {
    const { checkAuth } = useAuthStore()

    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    return (
        <ThemeProvider>
            <SeoHead />
            <AnalyticsTracker />
            <div className="min-h-screen bg-gray-50 dark:bg-iv-dark-bg">
                <Suspense fallback={<div className="min-h-[70vh] grid place-items-center" role="status">Загрузка страницы…</div>}>
                <Routes>
                    {/* Public routes */}
                    <Route path="/training/resume" element={<ProtectedRoute><ResumeTrainingPage /></ProtectedRoute>} />
                    <Route path="/" element={<HomePage />} />
                    <Route path="/preparation" element={<PublicCatalogPage />} />
                    <Route path="/jobs" element={<PublicCatalogPage jobs />} />
                    {[pythonPreparation,...preparations].map(item => <Route key={item.slug} path={'/preparation/'+item.slug} element={<PreparationPage key={item.slug} slug={item.slug} />} />)}
                    {jobTracks.map(item => <Route key={item.slug} path={'/jobs/'+item.slug} element={<PublicJobsPage key={item.slug} slug={item.slug} />} />)}
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/about-contractor" element={<ContractorPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/subscription/success" element={<PaymentSuccessPage />} />
                    <Route path="/subscription/fail" element={<PaymentFailPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
                    <Route path="/grafana" element={<GrafanaLoginPage />} />
                    <Route path="/metrics-login" element={<GrafanaLoginPage />} />

                    {/* Protected routes */}
                    <Route path="/system-design" element={<ProtectedRoute><Layout><SystemDesignPage /></Layout></ProtectedRoute>} />
                    <Route path="/system-design/:id" element={<ProtectedRoute><Layout><SystemDesignPage /></Layout></ProtectedRoute>} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <DashboardPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/activity"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <ActivityPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/calendar"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <ActivityPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/interviews/create"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <InterviewWizardPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/interviews/:id/edit"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <EditInterviewPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/interviews/:id/edit-full"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <EditInterviewFullPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/interview-service"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <InterviewServicePage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/interview/:id"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <InterviewPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/vacancies"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <VacanciesPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tracks"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <TracksPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/candidates" element={<Navigate to="/vacancies" replace />} />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <ProfilePage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/subscription"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <SubscriptionPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/contribute"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <ContributeQuestionPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/support"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <SupportPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/support/:id"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <SupportTicketPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <ReportsPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports/:id"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <ReportDetailPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <AdminRoute>
                                <AdminLayout>
                                    <AdminStatsPage />
                                </AdminLayout>
                            </AdminRoute>
                        }
                    />
                    <Route path="/admin/users" element={<AdminRoute><AdminLayout><AdminUsersPage /></AdminLayout></AdminRoute>} />
                    <Route
                        path="/admin/moderation"
                        element={
                            <AdminRoute>
                                <AdminLayout>
                                    <AdminModerationPage />
                                </AdminLayout>
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/moderation/:id"
                        element={
                            <AdminRoute>
                                <AdminLayout>
                                    <AdminQuestionDetailPage />
                                </AdminLayout>
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/questions"
                        element={
                            <AdminRoute>
                                <AdminLayout>
                                    <AdminQuestionsPage />
                                </AdminLayout>
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/questions/:id"
                        element={
                            <AdminRoute>
                                <AdminLayout>
                                    <AdminQuestionDetailPage />
                                </AdminLayout>
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/support"
                        element={
                            <AdminRoute>
                                <AdminLayout>
                                    <AdminSupportPage />
                                </AdminLayout>
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin/support/:id"
                        element={
                            <AdminRoute>
                                <AdminLayout>
                                    <AdminSupportTicketPage />
                                </AdminLayout>
                            </AdminRoute>
                        }
                    />
                    <Route path="/pro-trial" element={<ProTrialPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
                </Suspense>
                <TrainingLimitPromo />
            </div>
        </ThemeProvider>
    )
}

export default App
