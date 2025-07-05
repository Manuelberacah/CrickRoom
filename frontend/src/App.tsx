"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import io, { type Socket } from "socket.io-client"
import { Users, Clock, Trophy, Play, UserPlus, Crown, Timer, Zap, Star, ChevronRight, Sparkles } from "lucide-react"
import "./App.css"

const SOCKET_URL = "http://localhost:5001"

interface User {
  id: string
  name: string
}

interface Player {
  id: number
  name: string
  role: string
  country: string
}

interface SelectedPlayer extends Player {
  userId: string
  userName: string
  isAutoSelected?: boolean
}

interface Room {
  id: string
  users: User[]
  isHost: boolean
  availablePlayers: Player[]
}

interface TurnInfo {
  userId: string
  userName: string
}

// Landing Page Component
const LandingPage: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <motion.div
      className="landing-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.8 }}
    >
      <div className="landing-background">
        <div className="cricket-field"></div>
        <div className="floating-particles">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="particle"
              initial={{
                x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000),
                opacity: 0,
              }}
              animate={{
                y: [null, Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000)],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="landing-content">
        <motion.div
          className="brand-container"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <motion.div
            className="app-logo"
            initial={{ scale: 0.5, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          >
            <Trophy className="logo-icon" />
          </motion.div>

          <motion.h1
            className="app-title"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <span className="title-crick">Crick</span>
            <span className="title-room">Room</span>
          </motion.h1>

          <motion.p
            className="app-tagline"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            Step Into the Selection Zone
          </motion.p>

          <motion.div
            className="feature-highlights"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <div className="feature-item">
              <Users className="feature-icon" />
              <span>Real-time Multiplayer</span>
            </div>
            <div className="feature-item">
              <Timer className="feature-icon" />
              <span>Turn-based Selection</span>
            </div>
            <div className="feature-item">
              <Zap className="feature-icon" />
              <span>Live Updates</span>
            </div>
          </motion.div>

          <motion.button
            className="enter-button"
            onClick={onEnter}
            initial={{ y: 50, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.7 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="button-icon" />
            Enter CrickRoom
            <ChevronRight className="button-arrow" />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Main App Component
const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [currentView, setCurrentView] = useState<"home" | "room" | "game">("home")

  // Simplified state - just usernames
  const [createUserName, setCreateUserName] = useState("")
  const [joinUserName, setJoinUserName] = useState("")
  const [joinHostName, setJoinHostName] = useState("")

  const [userId, setUserId] = useState("")
  const [room, setRoom] = useState<Room | null>(null)
  const [isSelectionStarted, setIsSelectionStarted] = useState(false)
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([])
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string>("")
  const [turnOrder, setTurnOrder] = useState<TurnInfo[]>([])
  const [timeLeft, setTimeLeft] = useState<number>(10)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [notification, setNotification] = useState<string>("")
  const [finalTeams, setFinalTeams] = useState<any[]>([])
  const [isGameEnded, setIsGameEnded] = useState(false)

  useEffect(() => {
    if (!showLanding) {
      const newSocket = io(SOCKET_URL)
      setSocket(newSocket)
      setUserId(Math.random().toString(36).substr(2, 9))

      return () => {
        newSocket.close()
      }
    }
  }, [showLanding])

  useEffect(() => {
    if (!socket) return

    socket.on("room-joined", (data) => {
      setRoom(data)
      setAvailablePlayers(data.availablePlayers)
      setCurrentView("room")
      showNotification(`Joined ${data.hostName}'s room successfully!`)
    })

    socket.on("user-joined", (data) => {
      setRoom((prev) => (prev ? { ...prev, users: data.users } : null))
      showNotification(`${data.userName} joined the room`)
    })

    socket.on("selection-started", (data) => {
      setIsSelectionStarted(true)
      setTurnOrder(data.turnOrder)
      setCurrentTurn(data.currentTurn)
      setCurrentUserName(data.currentUserName)
      setAvailablePlayers(data.availablePlayers)
      setIsMyTurn(data.currentTurn === userId)
      setCurrentView("game")
      showNotification("Team selection has started!")
    })

    socket.on("turn-changed", (data) => {
      setCurrentTurn(data.currentTurn)
      setCurrentUserName(data.currentUserName)
      setIsMyTurn(data.currentTurn === userId)
      setTimeLeft(10)
    })

    socket.on("turn-timer-started", () => {
      setTimeLeft(10)
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    })

    socket.on("player-selected", (data) => {
      setSelectedPlayers((prev) => [
        ...prev,
        {
          ...data.player,
          userId: data.userId,
          userName: data.userName,
          isAutoSelected: data.isAutoSelected,
        },
      ])
      setAvailablePlayers((prev) => prev.filter((p) => p.id !== data.player.id))

      if (data.isAutoSelected) {
        showNotification(`${data.userName}'s time ran out! Auto-selected ${data.player.name}`)
      } else {
        showNotification(`${data.userName} selected ${data.player.name}`)
      }
    })

    socket.on("selection-ended", (data) => {
      setFinalTeams(data.finalTeams)
      setIsGameEnded(true)
      setIsSelectionStarted(false)
      showNotification("Team selection completed!")
    })

    socket.on("error", (data) => {
      showNotification(data.message, "error")
    })

    return () => {
      socket.off("room-joined")
      socket.off("user-joined")
      socket.off("selection-started")
      socket.off("turn-changed")
      socket.off("turn-timer-started")
      socket.off("player-selected")
      socket.off("selection-ended")
      socket.off("error")
    }
  }, [socket, userId])

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification(message)
    setTimeout(() => setNotification(""), 3000)
  }

  const createRoom = async () => {
    if (!createUserName.trim()) {
      showNotification("Please enter your name", "error")
      return
    }

    try {
      const response = await fetch(`${SOCKET_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName: createUserName }),
      })

      const data = await response.json()
      setUserId(data.hostId)

      socket?.emit("join-room", {
        hostName: createUserName,
        userName: createUserName,
        userId: data.hostId,
      })
    } catch (error) {
      showNotification("Failed to create room", "error")
    }
  }

  const joinRoom = () => {
    if (!joinUserName.trim() || !joinHostName.trim()) {
      showNotification("Please enter your name and host's name", "error")
      return
    }

    socket?.emit("join-room", {
      hostName: joinHostName.trim(),
      userName: joinUserName,
      userId,
    })
  }

  const startSelection = () => {
    socket?.emit("start-selection", { hostName: room?.hostName, userId })
  }

  const selectPlayer = (playerId: number) => {
    if (!isMyTurn) return
    socket?.emit("select-player", { hostName: room?.hostName, userId, playerId })
  }

  const resetGame = () => {
    setCurrentView("home")
    setRoom(null)
    setIsSelectionStarted(false)
    setSelectedPlayers([])
    setFinalTeams([])
    setIsGameEnded(false)
    setCreateUserName("")
    setJoinUserName("")
    setJoinHostName("")
  }

  if (showLanding) {
    return (
      <AnimatePresence>
        <LandingPage onEnter={() => setShowLanding(false)} />
      </AnimatePresence>
    )
  }

  return (
    <div className="app">
      <AnimatePresence>
        {notification && (
          <motion.div
            className={`notification ${notification.includes("error") || notification.includes("failed") ? "error" : "success"}`}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header className="app-header" initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.6 }}>
        <div className="header-content">
          <div className="brand-mini">
            <Trophy className="mini-logo" />
            <span className="brand-text">CrickRoom</span>
          </div>
          {room && (
            <div className="room-info">
              <span className="room-host">Host: {room.hostName}</span>
            </div>
          )}
        </div>
      </motion.header>

      <main className="app-main">
        <AnimatePresence mode="wait">
          {currentView === "home" && (
            <motion.div
              key="home"
              className="home-view"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <div className="home-container">
                <motion.div
                  className="welcome-section"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2>Welcome to the Selection Zone</h2>
                  <p>Create or join a room to start your cricket team selection journey</p>
                </motion.div>

                <div className="action-cards">
                  <motion.div
                    className="action-card create-card"
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <div className="card-icon">
                      <Crown />
                    </div>
                    <h3>Create Room</h3>
                    <p>Start a new selection room and invite friends</p>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={createUserName}
                      onChange={(e) => setCreateUserName(e.target.value)}
                      className="name-input"
                    />
                    <motion.button
                      onClick={createRoom}
                      className="action-button create-button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Play size={20} />
                      Create Room
                    </motion.button>
                  </motion.div>

                  <motion.div
                    className="action-card join-card"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <div className="card-icon">
                      <UserPlus />
                    </div>
                    <h3>Join Room</h3>
                    <p>Enter your name and the host's name to join</p>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={joinUserName}
                      onChange={(e) => setJoinUserName(e.target.value)}
                      className="name-input"
                    />
                    <input
                      type="text"
                      placeholder="Enter host's name"
                      value={joinHostName}
                      onChange={(e) => setJoinHostName(e.target.value)}
                      className="room-input"
                    />
                    <motion.button
                      onClick={joinRoom}
                      className="action-button join-button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <UserPlus size={20} />
                      Join Room
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === "room" && room && (
            <motion.div
              key="room"
              className="room-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <div className="room-container">
                <motion.div
                  className="room-header"
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2>{room.hostName}'s Selection Room</h2>
                  <div className="room-status">
                    <Users size={20} />
                    <span>{room.users.length} players joined</span>
                  </div>
                  <div className="join-instruction">
                    <p>
                      Tell your friends to join using your name: <strong>{room.hostName}</strong>
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="users-grid"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {room.users.map((user, index) => (
                    <motion.div
                      key={user.id}
                      className={`user-card ${user.id === userId ? "current-user" : ""}`}
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.1 * index, type: "spring" }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                      <span className="user-name">{user.name}</span>
                      {room.isHost && user.id === userId && <Crown className="host-crown" />}
                    </motion.div>
                  ))}
                </motion.div>

                {room.isHost && (
                  <motion.div
                    className="host-controls"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <motion.button
                      onClick={startSelection}
                      className="start-button"
                      disabled={room.users.length < 2}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Play size={24} />
                      Start Team Selection
                    </motion.button>
                    {room.users.length < 2 && <p className="min-players-text">Need at least 2 players to start</p>}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {currentView === "game" && (
            <motion.div
              key="game"
              className="game-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {!isGameEnded ? (
                <div className="game-container">
                  <motion.div className="game-header" initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <div className="turn-info">
                      <h3>Current Turn: {currentUserName}</h3>
                      {isMyTurn && (
                        <motion.div className="timer-container" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <Clock size={20} />
                          <span className={`timer ${timeLeft <= 3 ? "urgent" : ""}`}>{timeLeft}s</span>
                        </motion.div>
                      )}
                    </div>

                    <div className="turn-order">
                      {turnOrder.map((turn, index) => (
                        <motion.div
                          key={turn.userId}
                          className={`turn-indicator ${turn.userId === currentTurn ? "active" : ""}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {turn.userName.charAt(0)}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <div className="game-content">
                    <motion.div
                      className="players-section"
                      initial={{ x: -100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h4>Available Players ({availablePlayers.length})</h4>
                      <div className="players-grid">
                        {availablePlayers.map((player) => (
                          <motion.div
                            key={player.id}
                            className={`player-card ${isMyTurn ? "selectable" : ""}`}
                            onClick={() => selectPlayer(player.id)}
                            whileHover={isMyTurn ? { scale: 1.05, y: -5 } : {}}
                            whileTap={isMyTurn ? { scale: 0.95 } : {}}
                            layout
                          >
                            <div className="player-info">
                              <h5>{player.name}</h5>
                              <span className="player-role">{player.role}</span>
                              <span className="player-country">{player.country}</span>
                            </div>
                            {isMyTurn && (
                              <motion.div
                                className="select-indicator"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <Star size={16} />
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div
                      className="selections-section"
                      initial={{ x: 100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h4>Recent Selections</h4>
                      <div className="selections-list">
                        {selectedPlayers
                          .slice(-5)
                          .reverse()
                          .map((selection, index) => (
                            <motion.div
                              key={`${selection.userId}-${selection.id}`}
                              className="selection-item"
                              initial={{ x: 50, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className="selection-info">
                                <span className="selector-name">{selection.userName}</span>
                                <span className="selected-player">{selection.name}</span>
                                {selection.isAutoSelected && <span className="auto-selected">Auto-selected</span>}
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              ) : (
                <motion.div
                  className="final-results"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                >
                  <motion.h2 initial={{ y: -50 }} animate={{ y: 0 }} transition={{ delay: 0.3 }}>
                    🏆 Team Selection Complete!
                  </motion.h2>

                  <div className="teams-grid">
                    {finalTeams.map((team, index) => (
                      <motion.div
                        key={team.userId}
                        className="team-card"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: index * 0.2 }}
                      >
                        <h3>{team.userName}'s Team</h3>
                        <div className="team-players">
                          {team.players.map((player: Player) => (
                            <div key={player.id} className="team-player">
                              <span className="player-name">{player.name}</span>
                              <span className="player-role">{player.role}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    onClick={resetGame}
                    className="new-game-button"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start New Game
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
