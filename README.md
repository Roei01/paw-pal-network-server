Interest-Based Social Network API
Overview
This project is a backend server for an interest-based social network where users can follow interests, like posts, share posts, and interact with other users' content. The backend is built using Node.js, Express, and MongoDB.

Features
User Authentication and Authorization: Secure endpoints with JWT.
Interest Management: Users can follow/unfollow interests and view related posts.
Post Interactions: Users can like, unlike, share, and save posts.
Dynamic Post Updates: Likes and shares are dynamically updated and persisted.
User Profile Management: Users can view their profile and posts they have interacted with.
Prerequisites
Node.js
MongoDB
Git
Installation and Setup
Clone the repository:
bash
Copy code
git clone <server-repo-url>
cd <server-repo-directory>
Install dependencies:
bash
Copy code
npm install
Configure environment variables:
Create a .env file in the root of the project and add the following environment variables:

bash
Copy code
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-secret-key>
Start the server:
bash
Copy code
npm run start
The server will be running at http://localhost:3000.

Note: If you are running the server on a free hosting service, the server may take approximately 40 seconds to start initially. Please be patient.

API Endpoints
User Authentication
POST /login: Authenticate user and return JWT token.
POST /register: Register a new user.
Interests and Posts
GET /interests: Get all available interests.
GET /user-interests: Get interests followed by the current user.
POST /follow-interest: Follow an interest.
POST /unfollow-interest: Unfollow an interest.
GET /interests-posts: Get posts related to the user's followed interests.
POST /posts/
/like: Like/unlike a post and return whether the current user liked the post.
POST /posts/
/share: Share a post.
POST /posts/
/save: Save/unsave a post.
GET /share: Return posts shared by the current user, including whether they liked the posts.
Server Structure
server.js: Main entry point for the application. Sets up Express server and middleware.
routes/: Contains all the route definitions for handling user, interest, and post-related requests.
models/: Mongoose models representing MongoDB collections (e.g., User, Post, Interest).
middlewares/: Custom middleware functions like authenticateToken for securing endpoints.
controllers/: Contains the core logic for handling requests, such as creating, updating, and deleting resources.
Running the Server
To start the server locally, run the following command after installing dependencies and setting up the environment variables:

bash
Copy code
npm run start
The server will start on http://localhost:3000.

Troubleshooting
Ensure MongoDB is running and accessible via the connection string provided in the .env file.
Make sure to provide a valid JWT token in the Authorization header for protected routes.
Check the terminal for any errors or warnings during the startup process.
Example .env File
plaintext
Copy code
MONGO_URI=mongodb://localhost:27017/interestNetwork
JWT_SECRET=your_secret_key
This README should now provide a clear and concise explanation of your server setup, features, and usage. It’s structured to look good when viewed on GitHub or any markdown viewer.






