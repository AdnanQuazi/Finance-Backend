import * as userService from '../services/user.service.js';
import { successResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  return successResponse(res, 'Users fetched successfully', users);
});

export const createUser = asyncHandler(async (req, res) => {
  const newUser = await userService.createUser(req.body);
  return res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser
  });
});

export const updateRole = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUserRole(req.params.id, req.body.role);
  return successResponse(res, 'User role updated successfully', updatedUser);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUserStatus(req.params.id, req.body.status);
  return successResponse(res, 'User status updated successfully', updatedUser);
});

export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  return successResponse(res, 'User deleted successfully');
});
