# Real-time Smart Hospital Management System

This project is a full-stack, real-time "Smart Hospital Management System" built with the MERN stack and Socket.io.

## Project Goal

To develop a comprehensive solution for managing hospital operations with a key focus on real-time data synchronization across the user interface.

## Features

-   User Authentication (Admin, Doctor, Receptionist)
-   Real-time Dashboard
-   Patient Management
-   Department Management
-   Doctor & Staff Management
-   Appointment Scheduling
-   Ward & Bed Management
-   Real-time Patient Queue
-   In-app Notifications

## Technology Stack

-   **Frontend:** React.js, Vite, Material-UI
-   **Backend:** Node.js, Express.js
-   **Database:** MongoDB, Mongoose
-   **Real-time Engine:** Socket.io
-   **Authentication:** JWT

## Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   npm
-   MongoDB

### Installation

1.  Clone the repository:
    ```sh
    git clone <repository-url>
    ```
2.  Navigate to the project directory:
    ```sh
    cd smart-hospital-management
    ```
3.  Install dependencies for both frontend and backend:
    ```sh
    npm install
    ```
4.  Create a `.env` file in the `backend` directory and add the following environment variables:
    ```
    PORT=5003
    MONGO_URI=mongodb://localhost:27017/smart-hospital
    JWT_SECRET=your-super-secret-key
    ```
5.  Start the development server for both frontend and backend:
    ```sh
    npm run dev
    ```

This will start the backend server on `http://localhost:5003` and the frontend development server on `http://localhost:5173`.
