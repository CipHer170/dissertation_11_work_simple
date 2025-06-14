# Network Analyzer

This project is a network analyzer that captures and displays DNS logs, interface statistics, and other network data. It consists of a Flask backend and a React frontend.

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn

## Installation

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the Flask server:
   ```bash
   python check_interfaces.py
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd front/my-analizer
   ```

2. Install the required Node.js packages:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

## Usage

- The backend API will be available at `http://localhost:5000`.
- The frontend will be available at `http://localhost:3000`.

## Features

- Real-time DNS log capture
- Network interface statistics
- Memory usage monitoring
- Multi-language support (English, Russian, Uzbek, Kazakh)

## Troubleshooting

- If you encounter any issues with memory usage, check the `Config` class in `check_interfaces.py` for memory limits.
- Ensure that all required ports are available and not blocked by a firewall.

## License

This project is licensed under the MIT License.
