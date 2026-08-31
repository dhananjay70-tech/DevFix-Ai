// Verifies service-to-service calls from the AI backend (not a user JWT).
export const verifyInternalKey = (req, res, next) => {
  const expected = process.env.INTERNAL_API_KEY

  if (!expected) {
    res.status(500)
    return next(new Error('INTERNAL_API_KEY is not configured on the server'))
  }

  const key = req.headers['x-internal-api-key']
  if (!key || key !== expected) {
    res.status(401)
    return next(new Error('Invalid internal API key'))
  }

  next()
}
