// Technology names, not the selected specialization, control practical tasks.
const TASK_TECHNOLOGIES = new Set([
    'python', 'java', 'javascript', 'typescript', 'go', 'golang', 'c#', 'csharp',
    'c', 'c++', 'php', 'ruby', 'rust', 'r', 'sql', 'kotlin', 'swift', 'scala',
    'dart', 'f#', 'objective-c', 'docker', 'react', 'react.js', 'reactjs',
])
export const WIZARD_STEPS = [
    { id: 1, title: 'Направление', description: 'Твоя специализация' },
    { id: 2, title: 'Технологии', description: 'Стек для практики' },
    { id: 3, title: 'Уровень', description: 'Сложность вопросов' },
    { id: 4, title: 'Задачи', description: 'Количество задач' },
    { id: 5, title: 'Старт', description: 'Проверка параметров' },
] as const
export function supportsPracticalTasks(technologies: readonly string[]) {
    return technologies.some(technology => TASK_TECHNOLOGIES.has(technology.trim().toLowerCase()))
}
export function trainingWizardSteps(technologies: readonly string[]) {
    return WIZARD_STEPS.filter(step => step.id !== 4 || supportsPracticalTasks(technologies))
}
export function resolveWizardStep(saved: number, technologies: readonly string[]) {
    const id = Number.isFinite(saved) ? Math.min(5, Math.max(1, Math.trunc(saved))) : 1
    return id === 4 && !supportsPracticalTasks(technologies) ? 5 : id
}
export function effectiveTaskMode(technologies: readonly string[], saved?: string): 'theory' | 'few' | 'many' {
    return supportsPracticalTasks(technologies) && (saved === 'few' || saved === 'many') ? saved : 'theory'
}
