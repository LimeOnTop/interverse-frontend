import { loadTrainingLimits } from './lib/trainingLimits'
// Resolve server policy before importing copy and mounting the app.
void loadTrainingLimits().finally(() => import('./renderApp'))
