export const schemas = {
	Role: {
		type: 'string',
		enum: ['viewer', 'analyst', 'manager', 'admin'],
	},
	UserStatus: {
		type: 'string',
		enum: ['active', 'inactive', 'suspended', 'pending'],
	},
	TransactionType: {
		type: 'string',
		enum: ['income', 'expense'],
	},
	ErrorBody: {
		type: 'object',
		required: ['code', 'message'],
		properties: {
			code: { type: 'string', example: 'VALIDATION_ERROR' },
			message: { type: 'string', example: 'Amount must be a positive number' },
			details: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						path: {
							type: 'array',
							items: { oneOf: [{ type: 'string' }, { type: 'number' }] },
						},
						message: { type: 'string' },
					},
				},
			},
		},
	},
	ErrorResponse: {
		type: 'object',
		required: ['success', 'error'],
		properties: {
			success: { type: 'boolean', example: false },
			error: { $ref: '#/components/schemas/ErrorBody' },
		},
	},
	SuccessEnvelope: {
		type: 'object',
		required: ['success', 'message'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'Operation successful' },
			data: {
				nullable: true,
				oneOf: [
					{ type: 'object' },
					{ type: 'array', items: { type: 'object' } },
					{ type: 'string' },
					{ type: 'number' },
					{ type: 'boolean' },
				],
			},
		},
	},
	PaginatedEnvelope: {
		type: 'object',
		required: ['success', 'message', 'data', 'pagination'],
		properties: {
			success: { type: 'boolean', example: true },
			message: { type: 'string', example: 'Records fetched successfully' },
			data: {
				type: 'array',
				items: { $ref: '#/components/schemas/FinancialRecord' },
			},
			pagination: {
				type: 'object',
				required: ['page', 'limit', 'total', 'totalPages'],
				properties: {
					page: { type: 'integer', example: 1 },
					limit: { type: 'integer', example: 10 },
					total: { type: 'integer', example: 84 },
					totalPages: { type: 'integer', example: 9 },
				},
			},
		},
	},
};
