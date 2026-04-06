import * as dashboardService from '../services/dashboard.service.js';
import { successResponse } from '../utils/apiResponse.js';

export const getSummary = async (req, res) => {
  const result = await dashboardService.getSummary();
  return successResponse(res, 'Dashboard summary fetched successfully', result);
};

export const getCategories = async (req, res) => {
  const result = await dashboardService.getCategories();
  return successResponse(res, 'Dashboard categories fetched successfully', result);
};

export const getTrends = async (req, res) => {
  const { period, from, to } = req.validated.query;
  const result = await dashboardService.getTrends(period, from, to);
  return successResponse(res, 'Dashboard trends fetched successfully', result);
};

export const getActivity = async (req, res) => {
  const result = await dashboardService.getActivity();
  return successResponse(res, 'Dashboard activity fetched successfully', result);
};
