import * as authService from '../services/auth.service.js';
import { successResponse } from '../utils/apiResponse.js';

export const login = async (req, res) => {
  const { email, password } = req.validated.body;
  const result = await authService.login(email, password);
  return successResponse(res, 'Login successful', result);
};

export const getMe = async (req, res) => {
  const userId = req.user.id;
  const result = await authService.getMe(userId);
  return successResponse(res, 'Profile fetched successfully', result);
};
