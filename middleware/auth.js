function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }
  if (req.session.userRole !== 'admin') {
    return res.redirect('/');
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
