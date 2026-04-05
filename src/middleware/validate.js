export const validate = (schema) => (req, res, next) => {
  try {
    const { body, query, params } = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    req.validated = {
      body,
      query,
      params,
    };
    next();
  } catch (error) {
    next(error);
  }
};