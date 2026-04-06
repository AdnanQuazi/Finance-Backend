export const schemas = {
	User: {
		type: 'object',
		properties: {
			id: { type: 'string', format: 'uuid' },
			name: { type: 'string', maxLength: 100 },
			email: { type: 'string', format: 'email', maxLength: 150 },
			role: { $ref: '#/components/schemas/Role' },
			status: { $ref: '#/components/schemas/UserStatus' },
			createdAt: { type: 'string', format: 'date-time' },
			updatedAt: { type: 'string', format: 'date-time' },
		},
	},
	CreateUserRequest: {
		type: 'object',
		required: ['name', 'email', 'password'],
		properties: {
			name: { type: 'string', minLength: 1, maxLength: 100 },
			email: { type: 'string', format: 'email' },
			password: { type: 'string', minLength: 6 },
			role: { $ref: '#/components/schemas/Role' },
			status: { $ref: '#/components/schemas/UserStatus' },
		},
	},
	UpdateUserRoleRequest: {
		type: 'object',
		required: ['role'],
		properties: {
			role: { $ref: '#/components/schemas/Role' },
		},
	},
	UpdateUserStatusRequest: {
		type: 'object',
		required: ['status'],
		properties: {
			status: { $ref: '#/components/schemas/UserStatus' },
		},
	},
};
