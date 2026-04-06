export const info = {
    openapi: '3.0.3',
    info: {
        title: 'Finance Backend API',
        version: '1.0.0',
        description: 'REST API for shared finance dashboard data with JWT auth...',
    },
    servers: [
        {
            url: process.env.API_BASE_URL || 'http://localhost:3000',
            description: 'Local development server',
        },
    ],
    tags: [
        { name: 'Auth', description: 'Authentication and current user profile' },
        { name: 'Users', description: 'Admin-only user lifecycle and role management' },
        { name: 'Records', description: 'Financial record CRUD and listing' },
        { name: 'Dashboard', description: 'Dashboard aggregates and activity views' },
    ],
};