const jwt = require("jsonwebtoken");

function authenticateUser(req, res, next) {
const headers = req.header('Authorization');
if(!headers) {
    return res.status(401).json({success: false, message: 'Unable to authenticate user'})
};
try {
    const token = headers.split(' ')[1]
    jwt.verify(token, process.env.JWT_SECRET_KEY);
    next();
} catch (error) {
    return res.status(401).json({success: false, message: error})
}
};

module.exports = authenticateUser;