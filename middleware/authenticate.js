const isAuthenticated = (req, res, next) => {
    
    if (req.session.user === undefined) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'You do not have access. Please authenticate via /login'
        });
    }
    next();
}

module.exports = {
    isAuthenticated
}