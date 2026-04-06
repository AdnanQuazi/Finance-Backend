import swaggerJsdoc from 'swagger-jsdoc';
import { info } from './info.js';
import { components } from './schemas/index.js';
import { paths } from './paths/index.js';

const swaggerDefinition = {
	...info,
	components,
	paths,
};

const swaggerOptions = {
	definition: swaggerDefinition,
	apis: [],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
