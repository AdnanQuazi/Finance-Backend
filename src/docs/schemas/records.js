export const schemas = {
	FinancialRecord: {
		type: 'object',
		properties: {
			id: { type: 'string', format: 'uuid' },
			amount: { type: 'string', example: '2500.00' },
			type: { $ref: '#/components/schemas/TransactionType' },
			category: { type: 'string', maxLength: 50 },
			date: { type: 'string', format: 'date' },
			notes: { type: 'string', nullable: true },
			createdBy: { type: 'string', format: 'uuid' },
			updatedBy: { type: 'string', format: 'uuid', nullable: true },
			deletedAt: { type: 'string', format: 'date-time', nullable: true },
			createdAt: { type: 'string', format: 'date-time' },
			updatedAt: { type: 'string', format: 'date-time' },
		},
	},
	CreateRecordRequest: {
		type: 'object',
		required: ['amount', 'type', 'category', 'date'],
		properties: {
			amount: { type: 'number', minimum: 0.01, example: 1500.75 },
			type: { $ref: '#/components/schemas/TransactionType' },
			category: { type: 'string', minLength: 1, maxLength: 50, example: 'salary' },
			date: { type: 'string', format: 'date', example: '2026-04-06' },
			notes: { type: 'string', example: 'April salary payout' },
		},
	},
	UpdateRecordRequest: {
		type: 'object',
		properties: {
			amount: { type: 'number', minimum: 0.01, example: 1450.0 },
			type: { $ref: '#/components/schemas/TransactionType' },
			category: { type: 'string', minLength: 1, maxLength: 50 },
			date: { type: 'string', format: 'date' },
			notes: { type: 'string' },
		},
	},
};
