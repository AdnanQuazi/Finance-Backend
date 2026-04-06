export const paths = {
	'/dashboard/summary': {
		get: {
			tags: ['Dashboard'],
			summary: 'Get dashboard summary totals',
			security: [{ bearerAuth: [] }],
			responses: {
				200: {
					description: 'Dashboard summary fetched successfully',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessEnvelope' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/DashboardSummary' },
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
	},
	'/dashboard/activity': {
		get: {
			tags: ['Dashboard'],
			summary: 'Get most recent activity (latest records)',
			security: [{ bearerAuth: [] }],
			responses: {
				200: {
					description: 'Dashboard activity fetched successfully',
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
												items: { $ref: '#/components/schemas/FinancialRecord' },
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
	},
	'/dashboard/categories': {
		get: {
			tags: ['Dashboard'],
			summary: 'Get category breakdown (analyst and above)',
			security: [{ bearerAuth: [] }],
			responses: {
				200: {
					description: 'Dashboard categories fetched successfully',
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
												items: { $ref: '#/components/schemas/CategoryBreakdownItem' },
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
	},
	'/dashboard/trends': {
		get: {
			tags: ['Dashboard'],
			summary: 'Get trends by period (analyst and above)',
			security: [{ bearerAuth: [] }],
			parameters: [
				{ name: 'period', in: 'query', schema: { type: 'string', enum: ['monthly', 'weekly'], default: 'monthly' } },
				{ name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
				{ name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
			],
			responses: {
				200: {
					description: 'Dashboard trends fetched successfully',
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
												items: { $ref: '#/components/schemas/TrendItem' },
											},
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
			},
		},
	},
};
