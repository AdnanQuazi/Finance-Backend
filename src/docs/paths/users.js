export const paths = {
	'/users': {
		get: {
			tags: ['Users'],
			summary: 'List all users (admin only)',
			security: [{ bearerAuth: [] }],
			responses: {
				200: {
					description: 'Users fetched successfully',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessEnvelope' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'array',
												items: { $ref: '#/components/schemas/User' },
											},
										},
									},
								],
							},
						},
					},
				},
				401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
			},
		},
		post: {
			tags: ['Users'],
			summary: 'Create user (admin only)',
			security: [{ bearerAuth: [] }],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/CreateUserRequest' },
					},
				},
			},
			responses: {
				201: {
					description: 'User created successfully',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessEnvelope' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/User' },
										},
									},
								],
							},
						},
					},
				},
				400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
			},
		},
	},
	'/users/{id}/role': {
		patch: {
			tags: ['Users'],
			summary: 'Update user role (admin only)',
			security: [{ bearerAuth: [] }],
			parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/UpdateUserRoleRequest' },
					},
				},
			},
			responses: {
				200: {
					description: 'User role updated successfully',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessEnvelope' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/User' },
										},
									},
								],
							},
						},
					},
				},
				400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				404: { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
			},
		},
	},
	'/users/{id}/status': {
		patch: {
			tags: ['Users'],
			summary: 'Update user status (admin only)',
			security: [{ bearerAuth: [] }],
			parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/UpdateUserStatusRequest' },
					},
				},
			},
			responses: {
				200: {
					description: 'User status updated successfully',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessEnvelope' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/User' },
										},
									},
								],
							},
						},
					},
				},
				400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				404: { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
			},
		},
	},
	'/users/{id}': {
		delete: {
			tags: ['Users'],
			summary: 'Delete user (admin only)',
			security: [{ bearerAuth: [] }],
			parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
			responses: {
				200: {
					description: 'User deleted successfully',
					content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } } },
				},
				400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				404: { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
			},
		},
	},
};
