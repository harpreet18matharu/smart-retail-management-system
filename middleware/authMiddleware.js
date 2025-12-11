// check if admin
const requireAdmin = (req, res, next) => {
    if (req.session.userId && req.session.role === 'admin') {
        return next();
    }

    res.status(403).render('error', { 
        message: "Heeeyyy, you're not supposed to be here. Admins only." 
    });
};

module.exports = { requireAdmin };