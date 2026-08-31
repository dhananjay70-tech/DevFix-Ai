export const getHealthStatus = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'devfix-core'
  })
}
