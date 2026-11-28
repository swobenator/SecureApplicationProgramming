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

router.post('/login', async(req, res) =>{
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if(!email || !password){
        return res.status(400).json({
            message: 'Email and password are required'
        })
    }

    try{
        //find the account using the email submitted
        const user = await new Promise((resolve, reject) =>{
            db.get(
                `Select user_id, display_name, email, password_hash, role 
                From users where email  = ?`,
                [email],
                (error, row) => {
                    if (error){
                        reject(error);
                    }else{
                        resolve(row)
                    }
                }
            )
        });

        if(!user){
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }
        
        //Compare the submutted password with the stored hash
        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if(!passwordMatches){
            return res.status(401).json({
                message: 'Invalid email or password'
            })
        }

        //Create a new session after authentication is successful
        await new Promise((resolve, reject) =>{
            req.session.regenerate((error)=>{
                if(error) reject(error);
                else resolve();
            });
        });

        req.session.user = {
            user_id: user.user_id, 
            displayName: user.displayName,
            email: user.email,
            role: user.role
        };

        await new Promise((resolve, reject) =>{
            req.session.save((error)=>{
                if(error){
                    reject(error)
                }
                else{
                   resolve(); 
                }
            })
        })

        return res.json({
            message: 'Login successful',
            user: req.session.user
        });

    }catch(error){
        console.error('Login error:', error.message);

        return res.status(500).json({
            message: 'Unable to log in at this time'
        });
    }
});


router.post('/logout', (req, res) =>{
    req.session.destroy((error)=>{
        if(error){
            console.error('Logout error:', error.message);

            return res.status(500).json({
                message: 'Unable to log out'
            });
        }

        res.clearCookie('connect.sid');

        return res.json({
            message: 'Logged out successfully'
        })
    })
})

module.exports = router