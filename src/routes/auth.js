const express = require('express');
const bcrypt = require('bcryptjs');
const {db} = require('../database/database')

const router = express.Router();


router.post('/register', async (req,res) =>{
    const displayName= typeof req.body.displayName === 'string'
    ? req.body.displayName.trim() : '';

    const email = typeof req.body.email === 'string'
    ? req.body.email.trim() : '';

    const password = typeof req.body.password === 'string'
    ? req.body.password.trim() : '';

    if(!displayName || !email || !password){
        res.status(400).json({
            message: 'All the input fields are required'
        })
    }

    if(displayName.length > 50){
        return res.status(400).json({
            message: 'The display name cannot exceed 50 characters'
        });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!emailPattern.test(email) || email.length > 254){
        return res.status(400).json({
            message: 'You must provide a valid email.'
        })
    }

    if(password.length < 8 || Buffer.byteLength(password, 'utf8') > 72){
        return res.status(400).json({
            message: 'Password must contain at least 8 character and no more than 72 UTF-8 bytes'
        })
    }

    try{
        //Check whether the email address is already registered
        const existingUser = await new Promise((resolve, reject)=>{
            db.get(
                'Select user_id FROM users Where email = ?',
                [email],
                (error, row) => {
                    if(error) reject(error);
                    else resolve(row);
                }
            );
        });
        
        if(existingUser){
            return res.status(409).json({
                message: 'An account with this email exists already'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        //insert the new account into the database
        const userId = await new Promise((resolve, reject) =>{
            db.run(
                `Insert INTO users (display_name, email, password_hash) Values (?, ?, ?)`,
                [displayName, email, passwordHash],
                function(error){
                    if(error){
                        reject(error);
                    }else{
                        resolve(this.lastID);
                    }
                });
        });

        return res.status(201).json({
            message: 'Account has been created successfully. You can now log in',
            user:{
                user_id: userId,
                display_name: displayName,
                email: email
            }
        });
    } catch(error){
        console('Registration error:', error.message);

        return res.status(500).json({
            message: 'Unable to create your account at this time'
        })
    }
});

module.exports = router