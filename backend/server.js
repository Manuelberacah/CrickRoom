const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const cors = require("cors")
const { v4: uuidv4 } = require("uuid")

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

app.use(cors())
app.use(express.json())

// In-memory storage - using lowercase hostName as key for case-insensitive matching
const rooms = new Map()
const users = new Map()

// Cricket players pool
const cricketPlayers = [
  { id: 1, name: "Virat Kohli", role: "Batsman", country: "India" },
  { id: 2, name: "Rohit Sharma", role: "Batsman", country: "India" },
  { id: 3, name: "MS Dhoni", role: "Wicket-keeper", country: "India" },
  { id: 4, name: "Jasprit Bumrah", role: "Bowler", country: "India" },
  { id: 5, name: "Hardik Pandya", role: "All-rounder", country: "India" },
  { id: 6, name: "KL Rahul", role: "Batsman", country: "India" },
  { id: 7, name: "Ravindra Jadeja", role: "All-rounder", country: "India" },
  { id: 8, name: "Mohammed Shami", role: "Bowler", country: "India" },
  { id: 9, name: "Shikhar Dhawan", role: "Batsman", country: "India" },
  { id: 10, name: "Yuzvendra Chahal", role: "Bowler", country: "India" },
  { id: 11, name: "Rishabh Pant", role: "Wicket-keeper", country: "India" },
  { id: 12, name: "Bhuvneshwar Kumar", role: "Bowler", country: "India" },
  { id: 13, name: "Shreyas Iyer", role: "Batsman", country: "India" },
  { id: 14, name: "Washington Sundar", role: "All-rounder", country: "India" },
  { id: 15, name: "Ishan Kishan", role: "Wicket-keeper", country: "India" },
  { id: 16, name: "Babar Azam", role: "Batsman", country: "Pakistan" },
  { id: 17, name: "Kane Williamson", role: "Batsman", country: "New Zealand" },
  { id: 18, name: "David Warner", role: "Batsman", country: "Australia" },
  { id: 19, name: "Jos Buttler", role: "Wicket-keeper", country: "England" },
  { id: 20, name: "Trent Boult", role: "Bowler", country: "New Zealand" },
]

// Helper functions
function getRoomKey(hostName) {
  return hostName.toLowerCase().trim()
}

function createRoom(hostId, hostName) {
  const roomKey = getRoomKey(hostName)
  const room = {
    hostName: hostName, // Keep original case for display
    roomKey: roomKey, // Lowercase for matching
    host: hostId,
    users: [{ id: hostId, name: hostName, selectedPlayers: [] }],
    availablePlayers: [...cricketPlayers],
    isSelectionStarted: false,
    currentTurn: null,
    turnOrder: [],
    turnTimer: null,
    selectionRound: 1,
    maxRounds: 5,
  }
  rooms.set(roomKey, room)
  console.log(`Room created: ${hostName} (key: ${roomKey})`)
  console.log(`Total rooms: ${rooms.size}`)
  return room
}

function getRoom(hostName) {
  const roomKey = getRoomKey(hostName)
  console.log(`Looking for room: ${hostName} (key: ${roomKey})`)
  console.log(`Available rooms:`, Array.from(rooms.keys()))
  return rooms.get(roomKey)
}

function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getNextTurn(room) {
  const currentIndex = room.turnOrder.findIndex((userId) => userId === room.currentTurn)
  const nextIndex = (currentIndex + 1) % room.turnOrder.length
  return room.turnOrder[nextIndex]
}

function autoSelectPlayer(hostName, userId) {
  const room = getRoom(hostName)
  if (!room || room.currentTurn !== userId) return

  const availablePlayer = room.availablePlayers[0]
  if (availablePlayer) {
    selectPlayerForUser(hostName, userId, availablePlayer.id, true)
  }
}

function selectPlayerForUser(hostName, userId, playerId, isAutoSelected = false) {
  const room = getRoom(hostName)
  if (!room) return

  const user = room.users.find((u) => u.id === userId)
  const player = room.availablePlayers.find((p) => p.id === playerId)

  if (!user || !player) return

  // Add player to user's team
  user.selectedPlayers.push(player)

  // Remove player from available pool
  room.availablePlayers = room.availablePlayers.filter((p) => p.id !== playerId)

  // Clear current timer
  if (room.turnTimer) {
    clearTimeout(room.turnTimer)
    room.turnTimer = null
  }

  // Broadcast the selection
  io.to(room.roomKey).emit("player-selected", {
    userId,
    userName: user.name,
    player,
    isAutoSelected,
    remainingPlayers: room.availablePlayers.length,
  })

  // Check if selection is complete
  const allUsersComplete = room.users.every((u) => u.selectedPlayers.length === room.maxRounds)

  if (allUsersComplete) {
    room.isSelectionStarted = false
    io.to(room.roomKey).emit("selection-ended", {
      finalTeams: room.users.map((u) => ({
        userId: u.id,
        userName: u.name,
        players: u.selectedPlayers,
      })),
    })
    return
  }

  // Move to next turn
  room.currentTurn = getNextTurn(room)
  startTurnTimer(hostName)

  io.to(room.roomKey).emit("turn-changed", {
    currentTurn: room.currentTurn,
    currentUserName: room.users.find((u) => u.id === room.currentTurn)?.name,
  })
}

function startTurnTimer(hostName) {
  const room = getRoom(hostName)
  if (!room) return

  room.turnTimer = setTimeout(() => {
    autoSelectPlayer(hostName, room.currentTurn)
  }, 10000) // 10 seconds

  io.to(room.roomKey).emit("turn-timer-started", { duration: 10000 })
}

// REST API Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Cricket Team Selection Server is running!" })
})

app.post("/api/rooms", (req, res) => {
  const { hostName } = req.body
  if (!hostName || !hostName.trim()) {
    return res.status(400).json({ error: "Host name is required" })
  }

  const trimmedHostName = hostName.trim()
  const roomKey = getRoomKey(trimmedHostName)

  // Check if room already exists
  if (rooms.has(roomKey)) {
    return res.status(400).json({ error: "A room with this host name already exists" })
  }

  const hostId = uuidv4()
  const room = createRoom(hostId, trimmedHostName)

  res.json({
    hostName: room.hostName,
    hostId,
    message: "Room created successfully",
  })
})

app.get("/api/rooms/:hostName", (req, res) => {
  const { hostName } = req.params
  const room = getRoom(hostName)

  if (!room) {
    return res.status(404).json({ error: "Room not found" })
  }

  res.json({
    hostName: room.hostName,
    users: room.users.map((u) => ({ id: u.id, name: u.name })),
    isSelectionStarted: room.isSelectionStarted,
    availablePlayersCount: room.availablePlayers.length,
  })
})

// Socket.IO Events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("join-room", ({ hostName, userName, userId }) => {
    console.log(`Join room request: hostName=${hostName}, userName=${userName}, userId=${userId}`)

    const room = getRoom(hostName)

    if (!room) {
      console.log(`Room not found for hostName: ${hostName}`)
      socket.emit("error", { message: `Room not found. Make sure the host name "${hostName}" is correct.` })
      return
    }

    if (room.isSelectionStarted) {
      socket.emit("error", { message: "Selection already in progress" })
      return
    }

    // Check if user already exists in room
    const existingUser = room.users.find((u) => u.id === userId)
    if (!existingUser) {
      room.users.push({ id: userId, name: userName, selectedPlayers: [] })
      console.log(`User ${userName} added to room ${room.hostName}`)
    }

    socket.join(room.roomKey)
    users.set(socket.id, { userId, roomKey: room.roomKey })

    // Send room state to the joining user
    socket.emit("room-joined", {
      hostName: room.hostName,
      users: room.users.map((u) => ({ id: u.id, name: u.name })),
      isHost: room.host === userId,
      availablePlayers: room.availablePlayers,
    })

    // Notify others about new user
    socket.to(room.roomKey).emit("user-joined", {
      userId,
      userName,
      users: room.users.map((u) => ({ id: u.id, name: u.name })),
    })

    console.log(`User ${userName} joined room ${room.hostName}. Total users: ${room.users.length}`)
  })

  socket.on("start-selection", ({ hostName, userId }) => {
    const room = getRoom(hostName)

    if (!room || room.host !== userId) {
      socket.emit("error", { message: "Only host can start selection" })
      return
    }

    if (room.users.length < 2) {
      socket.emit("error", { message: "Need at least 2 players to start" })
      return
    }

    // Generate random turn order
    room.turnOrder = shuffleArray(room.users.map((u) => u.id))
    room.currentTurn = room.turnOrder[0]
    room.isSelectionStarted = true

    console.log(
      `Selection started in room ${room.hostName}. Turn order:`,
      room.turnOrder.map((id) => room.users.find((u) => u.id === id)?.name),
    )

    // Notify all users
    io.to(room.roomKey).emit("selection-started", {
      turnOrder: room.turnOrder.map((userId) => ({
        userId,
        userName: room.users.find((u) => u.id === userId)?.name,
      })),
      currentTurn: room.currentTurn,
      currentUserName: room.users.find((u) => u.id === room.currentTurn)?.name,
      availablePlayers: room.availablePlayers,
    })

    // Start the first turn timer
    startTurnTimer(hostName)
  })

  socket.on("select-player", ({ hostName, userId, playerId }) => {
    const room = getRoom(hostName)

    if (!room || !room.isSelectionStarted) {
      socket.emit("error", { message: "Selection not in progress" })
      return
    }

    if (room.currentTurn !== userId) {
      socket.emit("error", { message: "Not your turn" })
      return
    }

    selectPlayerForUser(hostName, userId, playerId)
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
    const userData = users.get(socket.id)

    if (userData) {
      const { userId, roomKey } = userData
      const room = rooms.get(roomKey)

      if (room) {
        // Remove user from room
        const userToRemove = room.users.find((u) => u.id === userId)
        room.users = room.users.filter((u) => u.id !== userId)

        console.log(`User ${userToRemove?.name} left room ${room.hostName}. Remaining users: ${room.users.length}`)

        // If room is empty, delete it
        if (room.users.length === 0) {
          if (room.turnTimer) {
            clearTimeout(room.turnTimer)
          }
          rooms.delete(roomKey)
          console.log(`Room ${room.hostName} deleted (empty)`)
        } else {
          // Notify remaining users
          socket.to(roomKey).emit("user-left", {
            userId,
            users: room.users.map((u) => ({ id: u.id, name: u.name })),
          })
        }
      }

      users.delete(socket.id)
    }
  })
})

// Use environment variable or default to 5001 if 5000 is busy
const PORT = process.env.PORT || 5001
server.listen(PORT, () => {
  console.log(`🏏 Cricket Team Selection Server running on port ${PORT}`)
  console.log(`Available at: http://localhost:${PORT}`)
})
