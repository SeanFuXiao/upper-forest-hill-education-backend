# upper-forest-hill-education-backend

## Overview

The backend is a Node.js + Express application providing authentication, role-based access, course management, assignment tracking, and attendance features.

## Features

- **User Authentication:** JWT-based authentication (Registration, Login, Password Reset)
- **Role-based Access:** Admin, Teacher, Student
- **Course Management:** CRUD operations for courses
- **Assignment Management:** Teachers create assignments, students submit them
- **Attendance Management:** Teachers mark attendance
- **Database:** PostgreSQL using Prisma ORM

## Tech Stack

- **Backend Framework:** Node.js + Express
- **Database:** PostgreSQL (`Prisma` ORM)
- **Authentication:** JWT (`jsonwebtoken`)
- **API:** RESTful API

## Installation

```bash
git clone https://github.com/SeanFuXiao/upper-forest-hill-education-backend.git
cd upper-forest-hill-education-backend
npm install
```

## Running the Project

```bash
npm run dev
```

**Default runs at:** `http://localhost:3000`

## Environment Variables

Create a `.env` file with:

```env
PORT=3000
DATABASE_URL="your-database-url"
JWT_SECRET="your-secret-key"
```

## API Endpoints

| Method   | Endpoint                   | Description             |
| -------- | -------------------------- | ----------------------- |
| `POST`   | `/api/auth/register`       | Register a new user     |
| `POST`   | `/api/auth/login`          | User login              |
| `POST`   | `/api/auth/reset-password` | Password reset          |
| `GET`    | `/api/courses`             | Get all courses         |
| `POST`   | `/api/courses`             | Create a new course     |
| `PUT`    | `/api/courses/:id`         | Update a course         |
| `DELETE` | `/api/courses/:id`         | Delete a course         |
| `GET`    | `/api/assignments`         | Get all assignments     |
| `POST`   | `/api/assignments`         | Create a new assignment |
| `GET`    | `/api/attendance`          | Get attendance records  |
| `POST`   | `/api/attendance`          | Mark attendance         |

## Database Migration

**Generate migration:**

```bash
npx prisma migrate dev --name init
```
