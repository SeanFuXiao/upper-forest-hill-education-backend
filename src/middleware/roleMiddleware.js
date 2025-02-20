const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.json({ error: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};

module.exports = { authorize };
