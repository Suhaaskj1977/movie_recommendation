# Movie Recommendation System

This project is a full-stack movie recommendation system that provides personalized movie suggestions to users. It consists of a React-based frontend and a Node.js/Express backend, with a Python service for enhanced recommendations using a dataset of Indian movies.

## Features
- User authentication (register, login)
- Personalized movie recommendations
- Recommendation history tracking
- Modern, responsive UI with React and Tailwind CSS
- Backend API with Express.js
- Enhanced recommendation logic using Python and a CSV dataset

## Project Structure
```
movie_recommendation/
├── backend/
│   ├── src/
│   │   ├── app.js                # Main Express app
│   │   ├── middleware/           # Auth, error, validation middleware
│   │   ├── models/               # Mongoose models (User, RecommendationHistory)
│   │   ├── routes/               # API routes (auth, user, recommendations)
│   │   ├── services/             # Python services, CSV dataset
│   │   └── utils/                # Database connection
│   ├── requirements.txt          # Python dependencies
│   └── package.json              # Node.js dependencies
├── frontend/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── context/              # Auth context
│   │   └── services/             # API service
│   ├── public/                   # Static assets
│   └── package.json              # React dependencies
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- Python 3.8+
- pnpm (or npm/yarn)

### Backend Setup
1. Navigate to the backend folder:
   ```sh
   cd backend
   ```
2. Install Node.js dependencies:
   ```sh
   pnpm install
   # or
   npm install
   ```
3. Install Python dependencies:
   ```sh
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```sh
   node src/app.js
   ```

### Frontend Setup
1. Navigate to the frontend folder:
   ```sh
   cd frontend
   ```
2. Install dependencies:
   ```sh
   pnpm install
   # or
   npm install
   ```
3. Start the React app:
   ```sh
   pnpm start
   # or
   npm start
   ```

### Environment Variables
- Configure your MongoDB URI and any secret keys in the backend as needed.

## Usage
- Register a new user or log in.
- Get personalized movie recommendations.
- View your recommendation history.

## Technologies Used
- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **Recommendation Service:** Python, pandas, CSV dataset

## License
This project is for educational purposes.