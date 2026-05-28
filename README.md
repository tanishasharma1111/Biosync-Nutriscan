# NutriScan AI

AI-powered food nutrition analyzer using computer vision and AI insights.

## Tech Stack

- **Frontend**: React (Vite) + TailwindCSS
- **Backend**: Flask (Python)
- **Image Processing**: OpenCV
- **Food Detection**: Clarifai API
- **Nutrition Data**: USDA FoodData Central (Free)
- **AI Insights**: Ollama (Llama 3)
- **Database**: SQLite via SQLAlchemy


## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- Ollama installed locally

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

### API Keys

1. **Clarifai**: Sign up at https://clarifai.com, get your Personal Access Token (PAT)
2. **USDA**: Get free API key at https://foodb.usda.USDA.gov/developer

Create a `.env` file in the backend directory:

```
CLARIFAI_PAT=your_clarifai_pat
USDA_API_KEY=your_usda_api_key
FLASK_ENV=development
DATABASE_URL=sqlite:///nutriscan.db
```

## Running the Application

### 1. Start Ollama (AI Insights)

```bash
ollama run llama3
```

### 2. Start Backend

```bash
cd backend
python app.py
```

Backend runs on http://localhost:5000

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on http://localhost:5173

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload image for nutrition analysis |
| GET | `/history` | Get all past scans |
| GET | `/scan/<id>` | Get single scan by ID |
| DELETE | `/scan/<id>` | Delete a scan |

## Deployment

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `gunicorn app:app`
5. Add environment variables from `.env`

### Frontend (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the frontend directory
3. Set API base URL to your Render backend URL

## How It Works

1. User uploads a food image
2. OpenCV preprocesses and enhances the image
3. Clarifai detects the food item with confidence score
4. USDA FoodData Central retrieves nutrition data
5. Ollama generates AI-powered health insights
6. All data is saved to SQLite database
7. Results displayed in a beautiful dashboard
