export const validate = (schema) => (req, res, next) => {
  try {
    const { body, query, params } = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Overwrite with cleaned/parsed data
    req.body = body;
    req.query = query;
    req.params = params;

    next();
  } catch (error) {
    next(error); 
  }
};
