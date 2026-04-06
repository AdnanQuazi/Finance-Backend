import { paths as authPaths } from './auth.js';
import { paths as userPaths } from './users.js';
import { paths as recordPaths } from './records.js';
import { paths as dashboardPaths } from './dashboard.js';

export const paths = {
	...authPaths,
	...userPaths,
	...recordPaths,
	...dashboardPaths,
};
