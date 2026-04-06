export const schemas = {
	LoginRequest: {
		type: 'object',
		required: ['email', 'password'],
		properties: {
			email: { type: 'string', format: 'email' },
			password: { type: 'string', minLength: 1 },
		},
	},
	LoginData: {
		type: 'object',
		required: ['user', 'token'],
		properties: {
			user: { $ref: '#/components/schemas/User' },
			token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
		},
	},
};
