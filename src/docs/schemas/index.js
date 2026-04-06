import * as common from './common.js';
import * as auth from './auth.js';
import * as users from './users.js';
import * as records from './records.js';
import * as dashboard from './dashboard.js';

export const components = {
    securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
        ...common.schemas,
        ...auth.schemas,
        ...users.schemas,
        ...records.schemas,
        ...dashboard.schemas,
    },
};