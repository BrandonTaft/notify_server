const jwt = require("jsonwebtoken");

function authenticateUser(req, res, next) {
const headers = req.header('Authorization');
console.log("HEADER", headers)
if(!headers) {
    return res.status(401).json({success: false, message: 'Unable to authenticate user'})
};
try {
    console.log(process.env.JWT_SECRET_KEY,"SECRET")
    const token = headers.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    req.userId = decoded.userId;
    next();
} catch (error) {
    return res.status(401).json({success: false, message: error})
}
};

module.exports = authenticateUser;