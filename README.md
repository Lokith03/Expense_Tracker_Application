# Expense Tracker Application

A full-stack Expense Tracker Application that helps users manage their daily financial transactions efficiently. The application allows users to add, update, delete, and view expenses while storing all records securely in a database.

This project demonstrates the implementation of full-stack web development using modern technologies including React, Node.js, and MySQL.

---

# Project Overview

| Feature | Description |
|--------|-------------|
| Expense Management | Track daily income and expenses |
| CRUD Operations | Add, update, delete, and view transactions |
| Database Integration | Store and retrieve financial data using MySQL |
| REST API | Backend APIs built with Node.js and Express |
| Interactive UI | Responsive frontend built using React |

---

# Technologies Used

| Layer | Technology |
|------|------------|
| Frontend | React.js |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Programming Language | JavaScript |
| Version Control | Git & GitHub |

---

# Key Features

- Track daily income and expenses
- Add new expense records
- Update existing expense details
- Delete unwanted transactions
- View all financial records in one place
- Real-time interaction between frontend and backend
- Secure data storage using MySQL

---

# System Architecture

| Component | Description |
|-----------|-------------|
| React Frontend | Handles user interface and user interactions |
| Node.js Backend | Processes requests and manages APIs |
| MySQL Database | Stores expense and income records |

---

# API Endpoints

| Method | Endpoint | Description |
|-------|----------|-------------|
| GET | /expenses | Fetch all expenses |
| POST | /expenses | Add new expense |
| PUT | /expenses/:id | Update expense |
| DELETE | /expenses/:id | Delete expense |

---

# Output 
<img width="1919" height="1017" alt="Screenshot 2026-03-19 211819" src="https://github.com/user-attachments/assets/616b716c-5ded-4e9c-9db8-4988d1af27d6" />

<img width="1914" height="1014" alt="Screenshot 2026-03-19 211855" src="https://github.com/user-attachments/assets/59c0a28c-fa8b-449e-85a7-c80516ead4b1" />

<img width="1918" height="1018" alt="Screenshot 2026-03-19 211957" src="https://github.com/user-attachments/assets/1f8c5783-4617-47ab-8206-95c56d739139" />

<img width="1919" height="1019" alt="Screenshot 2026-03-19 212035" src="https://github.com/user-attachments/assets/3900b351-9d53-4c37-86b5-fd258c732503" />

<img width="1919" height="1016" alt="Screenshot 2026-03-19 212124" src="https://github.com/user-attachments/assets/1a14e563-c16c-488d-b44b-4c98e378e0e6" />

<img width="1915" height="1013" alt="Screenshot 2026-03-19 212151" src="https://github.com/user-attachments/assets/664440bc-e3dc-46f3-886b-a6b5422a43b2" />

<img width="1919" height="1013" alt="Screenshot 2026-03-19 212238" src="https://github.com/user-attachments/assets/ac597d4a-0140-495b-82fc-c88b86478559" />

<img width="1919" height="1024" alt="Screenshot 2026-03-19 212250" src="https://github.com/user-attachments/assets/7838d2d0-4991-4d69-b494-86c08f47d8d7" />

<img width="1912" height="1020" alt="Screenshot 2026-03-19 212323" src="https://github.com/user-attachments/assets/99b2a723-116c-4876-91be-52ec6c873843" />

<img width="1915" height="1015" alt="Screenshot 2026-03-19 212447" src="https://github.com/user-attachments/assets/d583135d-1107-4af1-94e7-4f1e6c09f8e4" />

<img width="1917" height="1017" alt="Screenshot 2026-03-19 212545" src="https://github.com/user-attachments/assets/4e1c7e4b-a4cc-422b-87da-b547cd33a174" />

## 🔧 How to Run the Project

### Prerequisites
- Node.js installed
- MySQL installed
- git installed

### Step 1: Clone the Repository
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker

### Step 2: Backend Setup
cd backend
npm install

Create a `.env` file inside backend folder and add:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=expense_tracker
PORT=5000

Start backend server:
npm start

### Step 3: Frontend Setup
cd frontend
npm install
npm start

The application will run at:
http://localhost:5173

## Database Setup

### Step 1: Create Database
CREATE DATABASE expense_tracker;

### Step 2: Use Database
USE expense_tracker;

### Step 3: Create Table
CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  amount DECIMAL(10,2),
  category VARCHAR(100),
  date DATE
);

## Future Enhancements

- Implement user authentication (Login & Register)
- Add charts and analytics (Pie chart, Bar graph)
- Monthly and yearly expense reports
- Export data to PDF or Excel
- Add budget tracking feature
- Improve UI/UX and mobile responsiveness
- Add notifications/reminders for expenses
- Deploy application to cloud (AWS / Azure)





