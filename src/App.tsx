import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

// Pages
import HomePage from './pages/HomePage'
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
import OAuthCallbackPage from './pages/OAuthCallbackPage'

// Components
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
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
                </Routes>
            </div>
        </ThemeProvider>
    )
}

export default App
