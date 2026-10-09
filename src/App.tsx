import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

// Pages
import HomePage from './pages/HomePage'
import PricingPage from './pages/PricingPage'
import PrivacyPage from './pages/PrivacyPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardPage from './pages/DashboardPage'
import ActivityPage from './pages/ActivityPage'
import InterviewWizardPage from './pages/InterviewWizardPage'
import EditInterviewPage from './pages/EditInterviewPage'
import EditInterviewFullPage from './pages/EditInterviewFullPage'
import InterviewServicePage from './pages/InterviewServicePage'
import InterviewPage from './pages/InterviewPage'
import VacanciesPage from './pages/VacanciesPage'
import TracksPage from './pages/TracksPage'
import ReportsPage from './pages/ReportsPage'
import ReportDetailPage from './pages/ReportDetailPage'
import ProfilePage from './pages/ProfilePage'
import SubscriptionPage from './pages/SubscriptionPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import PaymentFailPage from './pages/PaymentFailPage'
import ContributeQuestionPage from './pages/ContributeQuestionPage'
import SupportPage from './pages/SupportPage'
import SupportTicketPage from './pages/SupportTicketPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import AdminStatsPage from './pages/admin/AdminStatsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage'
import AdminQuestionDetailPage from './pages/admin/AdminQuestionDetailPage'
import AdminModerationPage from './pages/admin/AdminModerationPage'
import AdminSupportPage from './pages/admin/AdminSupportPage'
import AdminSupportTicketPage from './pages/admin/AdminSupportTicketPage'
import GrafanaLoginPage from './pages/GrafanaLoginPage'

// Components
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
            <div className="min-h-screen bg-gray-50 dark:bg-iv-dark-bg">
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/pricing" element={<PricingPage />} />
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
                </Routes>
                <TrainingLimitPromo />
            </div>
        </ThemeProvider>
    )
}

export default App
