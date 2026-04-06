export const paths = {
	'/records': {
		get: {
			tags: ['Records'],
			summary: 'List records with filters and pagination',
			security: [{ bearerAuth: [] }],
			parameters: [
				{ name: 'type', in: 'query', schema: { $ref: '#/components/schemas/TransactionType' } },
				{ name: 'category', in: 'query', schema: { type: 'string' } },
				{ name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
				{ name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
				{ name: 'search', in: 'query', schema: { type: 'string' } },
				{ name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
				{ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
				{ name: 'sortBy', in: 'query', schema: { type: 'string', default: 'date' } },
				{ name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
			],
			responses: {
				200: {
					description: 'Records fetched successfully',
					content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedEnvelope' } } },
				},
				400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
			},
		},
		post: {
			tags: ['Records'],
			summary: 'Create financial record (manager and admin)',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					name: 'x-idempotency-key',
					in: 'header',
					required: true,
					schema: { type: 'string' },
					description: 'Unique client-generated key to deduplicate retried create requests',
				},
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/CreateRecordRequest' },
					},
				},
			},
			responses: {
				201: {
					description: 'Record created successfully',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessEnvelope' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/FinancialRecord' },
										},
									},
								],
							},
						},
					},
				},
				400: { description: 'Validation error or missing idempotency header', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
			},
		},
	},
	'/records/{id}': {
		get: {
			tags: ['Records'],
			summary: 'Get a single record by ID',
			security: [{ bearerAuth: [] }],
			parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
			responses: {
				200: {
					description: 'Record fetched successfully',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessEnvelope' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/FinancialRecord' },
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
				404: { description: 'Record not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
			},
		},
		patch: {
			tags: ['Records'],
			summary: 'Update record (manager and admin)',
			security: [{ bearerAuth: [] }],
			parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/UpdateRecordRequest' },
					},
				},
			},
			responses: {
				200: {
					description: 'Record updated successfully',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessEnvelope' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/FinancialRecord' },
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
				404: { description: 'Record not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
			},
		},
		delete: {
			tags: ['Records'],
			summary: 'Soft delete record (manager and admin)',
			security: [{ bearerAuth: [] }],
			parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
			responses: {
				200: {
					description: 'Record softly deleted successfully',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessEnvelope' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/FinancialRecord' },
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
				404: { description: 'Record not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
			},
		},
	},
	'/records/{id}/hard': {
		delete: {
			tags: ['Records'],
			summary: 'Hard delete record (admin only)',
			security: [{ bearerAuth: [] }],
			parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
			responses: {
				200: {
					description: 'Record hard deleted successfully',
					content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } } },
				},
				400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
				404: { description: 'Record not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
			},
		},
	},
};
