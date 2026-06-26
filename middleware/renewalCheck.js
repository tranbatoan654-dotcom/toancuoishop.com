const User = require('../models/User');

async function checkRenewal(req, res, next) {
  if (!req.session || !req.session.userId) return next();
  if (req.session.userRole === 'admin') return next();
  
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.redirect('/login');
    }
    
    const now = new Date();
    if (now > user.expiryDate) {
      req.session.isExpired = true;
    } else {
      req.session.isExpired = false;
      const daysLeft = Math.ceil((user.expiryDate - now) / (1000 * 60 * 60 * 24));
      req.session.daysLeft = daysLeft;
    }
    
    if (req.session.isExpired && req.path !== '/renewal' && req.path !== '/logout') {
      return res.redirect('/renewal');
    }
    
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = checkRenewal;