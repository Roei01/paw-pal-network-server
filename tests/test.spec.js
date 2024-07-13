import { expect } from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/server.js';  // ייבוא השרת שלך

before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect('mongodb://localhost:27017/pawpal-network-test', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
  }
});

after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  }
});

describe('User API', () => {
  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  describe('POST /register', () => {
    it('should register a new user', (done) => {
      request(app)
        .post('/register')
        .send({
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          email: 'testuser@example.com',
          password: 'password123',
          dateOfBirth: '1990-01-02'
        })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.equal('User registered');
          done();
        });
    });

    /*it('should not register a user with the same username', (done) => {
      // רישום משתמש חדש
      request(app)
        .post('/register')
        .send({
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          email: 'testuser@example.com',
          password: 'password123',
          dateOfBirth: '1990-01-01'
        })
        .expect(201)
        .end((err, res) => {
          if (err) {
            console.error('Error during first registration:', err);
            return done(err);
          }
          expect(res.text).to.equal('User registered');

          // ניסיון לרישום משתמש עם אותו שם משתמש
          request(app)
            .post('/register')
            .send({
              username: 'testuser',
              firstName: 'Test',
              lastName: 'User',
              email: 'testuser2@example.com',
              password: 'password123',
              dateOfBirth: '1990-01-01'
            })
            .expect(400)  // מצפה לשגיאה 400
            .end((err, res) => {
              if (err) {
                console.error('Error during second registration:', err);
                return done(err);
              }
              console.log('Response text from second registration:', res.text);
              expect(res.text).to.include('Username or email already exists');
              done();
            });
        });
    });*/
  });

  // בדיקות התחברות:
  describe('POST /login', () => {
    it('should login an existing user', (done) => {
      // רישום משתמש חדש
      request(app)
        .post('/register')
        .send({
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          email: 'testuser@example.com',
          password: 'password123',
          dateOfBirth: '1990-01-01'
        })
        .end((err, res) => {
          if (err) return done(err);

          // ניסיון להתחבר עם המשתמש שנרשם
          request(app)
            .post('/login')
            .send({
              username: 'testuser',
              password: 'password123'
            })
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);
              expect(res.body).to.have.property('token');
              done();
            });
        });
    });

    it('should not login with incorrect credentials', (done) => {
      // רישום משתמש חדש
      request(app)
        .post('/register')
        .send({
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          email: 'testuser@example.com',
          password: 'password123',
          dateOfBirth: '1990-01-01'
        })
        .end((err, res) => {
          if (err) return done(err);

          // ניסיון להתחבר עם סיסמא שגויה
          request(app)
            .post('/login')
            .send({
              username: 'testuser',
              password: 'wrongpassword'
            })
            .expect(400)
            .end((err, res) => {
              if (err) return done(err);
              expect(res.text).to.equal('Invalid credentials');
              done();
            });
        });
    });

    it('should not login with incorrect username', (done) => {
      // רישום משתמש חדש
      request(app)
        .post('/register')
        .send({
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          email: 'testuser@example.com',
          password: 'password123',
          dateOfBirth: '1990-01-01'
        })
        .end((err, res) => {
          if (err) return done(err);

          // ניסיון להתחבר עם שם משתמש שגוי
          request(app)
            .post('/login')
            .send({
              username: 'wronguser',
              password: 'password123'
            })
            .expect(404)
            .end((err, res) => {
              if (err) return done(err);
              expect(res.text).to.equal('User not found');
              done();
            });
        });
    });
  });

  describe('GET /profile', () => {
    let token;

    beforeEach((done) => {
      // רישום והתחברות של משתמש לפני הבדיקות כדי לקבל טוקן
      request(app)
        .post('/register')
        .send({
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          email: 'testuser@example.com',
          password: 'password123',
          dateOfBirth: '1990-01-01'
        })
        .end(() => {
          request(app)
            .post('/login')
            .send({
              username: 'testuser',
              password: 'password123'
            })
            .end((err, res) => {
              if (err) return done(err);
              token = res.body.token;
              done();
            });
        });
    });

    it('should get the profile of the logged-in user', (done) => {
      request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('username', 'testuser');
          done();
        });
    });
  });
});
