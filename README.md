# Instamern Backend API

The InstaMERN backend API powers the InstaMERN application, a full-stack social media platform similar to Instagram. This API allows users to register, log in, create posts & story, add comments, follow & unfollow, **AWS Cloud Computing** for storage & sending emals and more.

## Features

- Signup & login with secure token
- Security HTTP headers with **helmet**
- Rate limitting from the same **IP/API**
- Data Sanitization against **NoSQL** injection
- Data Sanitization against **XSS**
- Maganing & catching errors globally with **middleware** functions
- Sending token to users' email address with **AWS** to reset & update their password more secure
- Uploading posts to **AWS Cloud** & load from **MongoDB**
- Generate expired token
- Verifying **JSON Web Token**
- Sending JWT via **cokie**
- **Encrypting** & **hashing** passwords
- Restrict/protect some features by secure token
- Email validator
- Dedicate environments to **development** and **production**
- Structured users'data more secure with **mongoose Data Modelling**

## Base URL

The base URL for the backend API is https://instamern-3cda0fa07039.herokuapp.com/. All endpoints are relative to this base URL.

## Authentication

Authentication is the process of verifying the identity of a user or system. In the context of a back-end application, it ensures that only authorized users can access protected resources. Here are some key considerations for implementing authentication:

## User Registration

Implement a user registration process that collects necessary information, such as username, email, and password. Ensure that password requirements, such as length and complexity, are enforced.

## Login

Provide a secure login mechanism using sessions or tokens. Validate user credentials against stored data and generate authentication tokens or session cookies for subsequent requests.

## Authentication Middleware

Use middleware to authenticate requests. This middleware should check for valid authentication tokens, verify session cookies, or implement other authentication mechanisms.

## Authorization

Authorization determines what actions a user can perform within an application. It ensures that authenticated users have the necessary permissions to access or modify specific resources. Consider the following when implementing authorization

## Role-Based Access Control

Implement role-based access control (RBAC) to assign different permissions to different user roles. For example, an administrator role might have more privileges than a regular user role.

## Resource-Based Authorization

Control access to specific resources based on user roles and ownership. Ensure that users can only access resources they are authorized to view or modify.

## Security

Maintaining the security of your application is crucial to protect user data and prevent unauthorized access or data breaches. Consider the following security measures

#### Password Hashing

Store user passwords securely by hashing them with a strong cryptographic algorithm like bcrypt or Argon2. Hashing passwords prevents storing plain-text passwords in the database, making it harder for attackers to retrieve user passwords in case of a data breach.

#### Secure Communication

Enable secure communication between clients and the server using HTTPS/TLS. This ensures that data transmitted over the network is encrypted and protects against eavesdropping and tampering. Obtain and install an SSL certificate to enable HTTPS on your server.

#### Session Management

Implement secure session management to track user sessions and prevent session-related attacks such as session hijacking or fixation. Use secure session storage mechanisms, such as server-side storage or encrypted client-side storage (e.g., signed cookies), and regenerate session IDs after user authentication or privilege changes.

## END Points

#### Authentication

`POST /instamern/auth/register`: Register a new user.

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

Start the server on **production** environment

```bash
  npm start
```

## 🔗 Links

[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/hsyntes)
