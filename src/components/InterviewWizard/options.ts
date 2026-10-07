/** Options of the training wizard: directions, their stacks and grades. */

export const SPECIALIZATIONS = [
    { id: 'backend', name: 'Backend', description: 'Сервисы, API и данные', glyph: '{ }' },
    { id: 'frontend', name: 'Frontend', description: 'Интерфейсы и браузер', glyph: '</>' },
    { id: 'devops', name: 'DevOps', description: 'Инфраструктура и доставка', glyph: '~ /' },
    { id: 'qa', name: 'QA', description: 'Качество и автоматизация', glyph: '✓ /' },
    { id: 'data_science', name: 'Data Science', description: 'Данные и модели', glyph: 'ƒ x' },
]

export const LEVELS = [
    { id: 'intern', name: 'Intern', description: 'Основы и первые решения', glyph: '01' },
    { id: 'junior', name: 'Junior', description: 'Уверенная база', glyph: '02' },
    { id: 'middle', name: 'Middle', description: 'Самостоятельные решения', glyph: '03' },
    { id: 'senior', name: 'Senior', description: 'Компромиссы и архитектура', glyph: '04' },
    { id: 'lead', name: 'Lead / CTO', description: 'Стратегия и системный взгляд', glyph: '05' },
]

export const TECH_STACKS: Record<string, string[]> = {
    frontend: [
        'React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3',
        'Sass', 'Less', 'Webpack', 'Vite', 'Next.js', 'Nuxt.js', 'Svelte', 'Tailwind CSS'
    ],
    backend: [
        'Node.js', 'Python', 'Go', 'Java', 'C#', 'PHP', 'Ruby', 'Rust', 'Express.js',
        'Django', 'Flask', 'Gin', 'Spring Boot', 'Laravel', 'Rails', 'Actix'
    ],
    devops: [
        'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'Ansible',
        'Jenkins', 'GitLab CI', 'GitHub Actions', 'Prometheus', 'Grafana', 'ELK Stack'
    ],
    qa: [
        'Selenium', 'Cypress', 'Playwright', 'Jest', 'Mocha', 'Chai', 'TestNG',
        'JUnit', 'Postman', 'Newman', 'Appium', 'Robot Framework', 'Cucumber'
    ],
    data_science: [
        'Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow',
        'PyTorch', 'Jupyter', 'Tableau', 'Power BI', 'Apache Spark', 'Hadoop'
    ],
}
