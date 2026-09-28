import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

// Pages
import HomePage from './pages/HomePage'
import PricingPage from './pages/PricingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ActivityPage from './pages/ActivityPage'
import InterviewWizardPage from './pages/InterviewWizardPage'
import EditInterviewPage from './pages/EditInterviewPage'
import EditInterviewFullPage from './pages/EditInterviewFullPage'
import InterviewServicePage from './pages/InterviewServicePage'
import InterviewPage from './pages/InterviewPage'
import CandidatesPage from './pages/CandidatesPage'
import ReportsPage from './pages/ReportsPage'
import ReportDetailPage from './pages/ReportDetailPage'
import ProfilePage from './pages/ProfilePage'
import SubscriptionPage from './pages/SubscriptionPage'
import ContributeQuestionPage from './pages/ContributeQuestionPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import AdminStatsPage from './pages/admin/AdminStatsPage'
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage'
import AdminQuestionDetailPage from './pages/admin/AdminQuestionDetailPage'
import AdminModerationPage from './pages/admin/AdminModerationPage'

// Components
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
    const { checkAuth } = useAuthStore()

    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    return (
        <ThemeProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-iv-dark-bg">
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

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
                                    <CandidatesPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/candidates"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <CandidatesPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
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
                </Routes>
            </div>
        </ThemeProvider>
    )
}

export default App
