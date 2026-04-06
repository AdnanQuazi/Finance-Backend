export const schemas = {
	DashboardSummary: {
		type: 'object',
		properties: {
			totalIncome: { type: 'string', example: '9800.00' },
			totalExpense: { type: 'string', example: '4200.00' },
			netBalance: { type: 'number', example: 5600 },
		},
	},
	CategoryBreakdownItem: {
		type: 'object',
		properties: {
			category: { type: 'string', example: 'rent' },
			type: { $ref: '#/components/schemas/TransactionType' },
			total: { type: 'string', example: '1500.00' },
		},
	},
	TrendItem: {
		type: 'object',
		properties: {
			period: { type: 'string', format: 'date-time' },
			type: { $ref: '#/components/schemas/TransactionType' },
			total: { type: 'string', example: '3000.00' },
		},
	},
};
