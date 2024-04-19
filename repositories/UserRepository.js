const User = require('../models/UserModel');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const salt = 10;

class UserRepository {
  constructor(model) {
    this.model = model;
  };

  registerUser(user, res) {
    const { user_id, name, password, organization } = user; 
    this.model.findOne({ user_id: user_id }).then(async result => {
      if (result === null) {
        bcrypt.hash(password, salt, async (error, hash) => {
            if (error) {
                res.json({ message: "Something Went Wrong!!!" })
            } else {
                const user = new this.model({
                    user_id: user_id,
                    user_name: name,
                    password: hash,
                    organization: organization
                })
                
                let savedUser = await user.save()
                if (savedUser !== null) {
                    res.status(200).json({ success: true })
                }
            }
        })
    } else {
        res.json({ message: "That name is taken." })
    }
    })
  };

}

module.exports = new UserRepository(User);