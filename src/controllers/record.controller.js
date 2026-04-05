import * as recordService from '../services/record.service.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getRecords = asyncHandler(async (req, res) => {
  const { page, limit, sortBy, order, ...filters } = req.validated.query;
  const pagination = { page, limit, sortBy, order };

  const result = await recordService.getRecords(filters, pagination);
  return paginatedResponse(res, 'Records fetched successfully', result.records, page, limit, result.total);
});

export const getRecordById = asyncHandler(async (req, res) => {
  const record = await recordService.getRecordById(req.validated.params.id);
  return successResponse(res, 'Record fetched successfully', record);
});

export const createRecord = asyncHandler(async (req, res) => {
  const record = await recordService.createRecord(req.validated.body, req.user.id);
  return res.status(201).json({
    success: true,
    message: 'Record created successfully',
    data: record
  });
});

export const updateRecord = asyncHandler(async (req, res) => {
  const record = await recordService.updateRecord(req.validated.params.id, req.validated.body, req.user.id);
  return successResponse(res, 'Record updated successfully', record);
});

export const softDeleteRecord = asyncHandler(async (req, res) => {
  const record = await recordService.softDeleteRecord(req.validated.params.id, req.user.id);
  return successResponse(res, 'Record softly deleted successfully', record);
});

export const hardDeleteRecord = asyncHandler(async (req, res) => {
  await recordService.hardDeleteRecord(req.validated.params.id);
  return successResponse(res, 'Record hard deleted successfully');
});
