export const paths = {
	'/auth/login': {
		post: {
			tags: ['Auth'],
			summary: 'Login with email and password',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/LoginRequest' },
					},
				},
			},
			responses: {
				200: {
					description: 'Login successful',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessEnvelope' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/LoginData' },
										},
									},
								],
							},
						},
					},
				},
				400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				403: { description: 'Account not active', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
			},
		},
	},
	'/auth/me': {
		get: {
			tags: ['Auth'],
			summary: 'Get current user profile',
			security: [{ bearerAuth: [] }],
			responses: {
				200: {
					description: 'Profile fetched successfully',
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
				401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				404: { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
			},
		},
	},
};
