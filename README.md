# 🏏 CrickRoom - Step Into the Selection Zone

A real-time multiplayer cricket team selection application built with React, Node.js, Express, and Socket.IO.

## ✨ Features

- **Real-time Multiplayer**: Join rooms and select players with friends in real-time
- **Turn-based Selection**: Organized turn system with 10-second timers
- **Beautiful UI**: Modern, animated interface with smooth transitions
- **Auto-selection**: Automatic player selection if time runs out
- **Live Updates**: See all selections happen in real-time
- **Responsive Design**: Works perfectly on desktop and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <your-repo-url>
   cd cricket-team-selection
   \`\`\`

2. **Setup Backend**
   \`\`\`bash
   cd backend
   npm install
   npm run dev
   \`\`\`
   Backend will run on `http://localhost:5000`

3. **Setup Frontend** (in a new terminal)
   \`\`\`bash
   cd frontend
   npm install
   npm start
   \`\`\`
   Frontend will run on `http://localhost:3000`

### How to Play

1. **Create a Room**: Enter your name and click "Create Room"
2. **Share Room ID**: Share the room ID with friends
3. **Join Room**: Friends can join using the room ID
4. **Start Selection**: Host clicks "Start Team Selection"
5. **Select Players**: Take turns selecting cricket players (10 seconds each)
6. **View Results**: See final teams when selection is complete

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Framer Motion, Lucide React
- **Backend**: Node.js, Express.js, Socket.IO
- **Real-time Communication**: WebSockets via Socket.IO
- **Styling**: CSS3 with modern animations and transitions

## 📁 Project Structure

\`\`\`
cricket-team-selection/
├── backend/
│   ├── server.js          # Main server file
│   └── package.json       # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # Main React component
│   │   ├── App.css        # Styling
│   │   └── index.tsx      # React entry point
│   └── package.json       # Frontend dependencies
└── README.md
\`\`\`

## 🎮 Game Flow

1. **Room Creation**: Host creates a room and gets a unique room ID
2. **Player Joining**: Players join using the room ID
3. **Selection Start**: Host starts the selection process
4. **Turn Order**: Random turn order is generated
5. **Player Selection**: Each player gets 10 seconds to select a cricket player
6. **Auto-selection**: If time runs out, system auto-selects a player
7. **Completion**: Game ends when each player has 5 players
8. **Results**: Final teams are displayed

## 🚀 Deployment

### Backend (Railway/Render)
1. Push code to GitHub
2. Connect to Railway or Render
3. Deploy backend service
4. Note the deployed URL

### Frontend (Vercel/Netlify)
1. Update `SOCKET_URL` in `App.tsx` to your backend URL
2. Build the project: `npm run build`
3. Deploy to Vercel or Netlify

## 🎨 Features Implemented

✅ Real-time room management  
✅ Turn-based player selection  
✅ 10-second timer with auto-selection  
✅ Beautiful animated landing page  
✅ Responsive design  
✅ Live notifications  
✅ Host controls  
✅ Final team display  
✅ Modern UI with smooth transitions  

## 🔧 Environment Variables

No environment variables required for local development. For production:

- `PORT`: Server port (default: 5000)
- Update `SOCKET_URL` in frontend for production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**CrickRoom** - Step Into the Selection Zone! 🏏✨
\`\`\`
