export const successResponse = (res, message, data) => {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
};

export const paginatedResponse = (res, message, data, page, limit, total) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    }
  });
};

export const errorResponse = (res, statusCode, code, message) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    }
  });
};
