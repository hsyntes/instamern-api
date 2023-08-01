# Instamern Backend API

The InstaMERN backend API powers the InstaMERN application, a full-stack social media platform similar to Instagram. This API allows users to register, log in, create posts & story, add comments, follow & unfollow, **AWS Cloud Computing** for storage & sending emals and more.

## AWS Cloud Integration

The InstaMERN backend leverages **AWS Cloud Services** for various functionalities. Here are the AWS services used:

1. Amazon S3

   Description: Amazon S3 is used for storing and serving user-uploaded images, including post images and profile pictures.

2. Amazon SES

   Decription: Amazon SES is used for sending emails to users in order to reset passwords & emails by secure token.

## Features

- Signup & login with secure token
- Uploading posts/stories to **AWS Cloud** & load them from **MongoDB**
- Sending reset links to users' email address with **AWS SES** to reset & update their password more secure
- Structured users'data more secure with **mongoose Data Modelling** both **referencing** & **embedded**
- **Encrypting** & **hashing** passwords
- Email validator via both backend API & **AWS Cloud**
- Verifying **JSON Web Token**
- Security HTTP headers with **helmet**
- Rate limitting from the same **IP/API**
- Data Sanitization against **NoSQL** injection
- Data Sanitization against **XSS**
- Maganing & catching errors globally with **middleware** functions
- Generate expired token
- Sending JWT via **cokie**
- Restrict/protect some features by secure token
- Dedicate environments to **development** and **production**

## Base URL

The base URL for the backend API is https://instamern-3cda0fa07039.herokuapp.com/. All endpoints are relative to this base URL.

## Authentication

Authentication is the process of verifying the identity of a user or system. In the context of a back-end application, it ensures that only authorized users can access protected resources. Here are some key considerations for implementing authentication:

### User Registration

Implement a user registration process that collects necessary information, such as username, email, and password. Ensure that password requirements, such as length and complexity, are enforced.

### Login

Provide a secure login mechanism using sessions or tokens. Validate user credentials against stored data and generate authentication tokens or session cookies for subsequent requests.

## Authorization

Authorization determines what actions a user can perform within an application. It ensures that authenticated users have the necessary permissions to access or modify specific resources. Consider the following when implementing authorization

### Role-Based Access Control

Implement role-based access control (RBAC) to assign different permissions to different user roles. For example, an administrator role might have more privileges than a regular user role.

### Resource-Based Authorization

Control access to specific resources based on user roles and ownership. Ensure that users can only access resources they are authorized to view or modify.

## Security

Maintaining the security of your application is crucial to protect user data and prevent unauthorized access or data breaches. Consider the following security measures

#### Password Hashing

Store user passwords securely by hashing them with a strong cryptographic algorithm like bcrypt or Argon2. Hashing passwords prevents storing plain-text passwords in the database, making it harder for attackers to retrieve user passwords in case of a data breach.

#### Secure Communication

Enable secure communication between clients and the server using HTTPS/TLS. This ensures that data transmitted over the network is encrypted and protects against eavesdropping and tampering. Obtain and install an SSL certificate to enable HTTPS on your server.

#### Session Management

Implement secure session management to track user sessions and prevent session-related attacks such as session hijacking or fixation. Use secure session storage mechanisms, such as server-side storage or encrypted client-side storage (e.g., signed cookies), and regenerate session IDs after user authentication or privilege changes.

## Storage

Sotarage users' materials suchs as posts, profile pictures, stories in **AWS Cloud Object Storage**

## END Points

#### Authentication

`POST /instamern/users/signup`: Register a new user.

`POST /instamern/users/login`: Log in an existing user.

### User Profile

`GET /instamern/users/username/:username`: Get user profile by username.

`GET /instamern/users/authorization/current-user`: Get currently logged-in user by secure token.

### Posts

`GET /instamern/posts`: Get all posts.

`GET /instamern/posts/:id`: Get a single post by ID.

`POST /instamern/posts/upload`: Create a new post by secure token and storage it to **AWS Cloud**

`POST /instamern/posts/like/:id`: Like a post by current user's secure token.

`POST /instamern/posts/comment/:id`: Add a comment to a post by current user's secure token.

`DELETE /instamern/posts/delete/:id`: Delete a post by current user's secure token.

### Stories

`GET /instamern/stories`: Get all stories.

`POST /instamern/stories/upload`: Add a new story by current user's secure token and save it to **AWS Cloud**

## Run Locally

Clone the project

```bash
  git clone https://github.com/hsyntes/instamern-api
```

Go to the project directory

```bash
  cd instamern-api
```

Install dependencies

```bash
  npm install
```

Start the server on **production** environment as default.

```bash
  npm start
```

## 🔗 Links

[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/hsyntes)
