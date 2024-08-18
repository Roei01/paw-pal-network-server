Server README
Project Name: Interest-Based Social Network API
Overview
This project is a backend server for an interest-based social network where users can follow interests, like posts, share posts, and interact with other users' content. The backend is built using Node.js, Express, and MongoDB.

Features
User authentication and authorization using JWT.
Users can follow interests and see posts related to their followed interests.
Users can like, unlike, share, and save posts.
Posts are automatically updated with the number of likes and shares.
Users can manage their interests, including following and unfollowing interests.
The backend includes APIs for retrieving user information, interests, categories, and posts.
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

API Endpoints
User Authentication:

POST /login - Authenticate user and return JWT token.
POST /register - Register a new user.
Interests and Posts:

GET /interests - Get all available interests.
GET /user-interests - Get interests followed by the current user.
POST /follow-interest - Follow an interest.
POST /unfollow-interest - Unfollow an interest.
GET /interests-posts - Get posts related to the user's followed interests.
POST /posts/:id/like - Like/unlike a post.
POST /posts/:id/share - Share a post.
POST /posts/:id/save - Save/unsave a post.
Troubleshooting
Ensure MongoDB is running and accessible via the connection string provided in the .env file.
Make sure to provide a valid JWT token in the Authorization header for protected routes.
