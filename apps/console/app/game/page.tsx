'use client'

import {
  Gamepad2,
  MapPin,
  Play,
  RectangleGoggles,
  Wifi,
  WifiOff,
  Zap,
  Target,
  User,
  Trophy,
  Medal,
  Trash2,
  Power,
  RefreshCcw,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import useSocketConnection from '@/hooks/use-socket-connection'
import { cn } from '@/lib/utils'
import {
  DeviceContextProvider,
  useDeviceContext,
} from '@/context/device-context'
import {
  CONNECTION_EVENT,
  GAME_EVENT,
  ROOM_EVENT,
  VRDevice,
} from '@/types/models'
import { ChangeEventHandler, useEffect, useMemo, useRef, useState } from 'react'
import './game.styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useStore, useTable } from 'tinybase/ui-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Player {
  name: string
  points: number
  reaction: number
}

const GamePage = () => {
  return (
    <DeviceContextProvider>
      <GameDashboard />
    </DeviceContextProvider>
  )
}

export default GamePage

const GameDashboard = () => {
  const { devices } = useDeviceContext()
  const [selectedDevice, setSelectedDevice] = useState<VRDevice | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isPlaying, setPlaying] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [score, setScore] = useState(0)
  const [deviceConnected, setDeviceConnected] = useState(false)

  const connected = useSocketConnection({ device: selectedDevice })
  const store = useStore()

  const activePlayer = useRef<Player | null>(null)
  const hit = useRef(0)
  const reactionSum = useRef(0)

  const StoredPlayer = useTable('leaderboard', store) as unknown as {
    [name: string]: Player
  }

  const players = useMemo(
    () =>
      Object.keys(StoredPlayer).reduce((prev, next) => {
        const player = StoredPlayer[next as keyof typeof StoredPlayer] as Player
        return [...prev, player]
      }, [] as Player[]),
    [StoredPlayer],
  )

  const handleVRConnection = () => {
    const deviceId = selectedDevice?.data.deviceId
    if (!selectedDevice || !deviceId) return

    if (!connected) {
      selectedDevice.socket.io.opts.query.roomCode = deviceId

      selectedDevice.socket.connect()
      selectedDevice.usedBy = 'test'
      // setConnectionLoading(true);
    } else {
      selectedDevice.gameEnd()
      selectedDevice.socket.disconnect()
      selectedDevice.usedBy = null
      setMapLoaded(false)
      setPlaying(false)
      setDeviceConnected(false)
    }
  }

  const handleSelectVR = (device: VRDevice) => {
    if (selectedDevice) {
      return setSelectedDevice(null)
    }
    setSelectedDevice(device)
  }

  const handleLoadMap = () => {
    selectedDevice?.gameLoad({ avatarId: 0 })
  }

  const handleGameExit = () => {
    if (isPlaying) {
      selectedDevice?.gameEnd()
    }
  }

  const handleGameStart = () => {
    selectedDevice?.gameStart()
  }

  const handleSetPlayer = () => {
    const player: Player = {
      name: playerName,
      points: 0,
      reaction: 0,
    }
    activePlayer.current = player
    setPlayerReady(!playerReady)
    console.log(activePlayer.current)
  }

  const handleResetPlayer = () => {
    activePlayer.current = null
    setScore(0)
    setPlayerName('')
    setPlayerReady(false)
  }

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const { value } = e.target
    setPlayerName(value)
  }

  const handleClearLeaderboard = () => store?.delTable('leaderboard')

  const handleSaveToLeaderboard = () => {
    try {
      console.log('Saving...')
      if (!activePlayer.current) return
      store?.setRow('leaderboard', activePlayer.current.name, {
        ...activePlayer.current,
      })
      handleResetPlayer()
    } catch (error) {
      console.log('Error with saving to leaderboard.', error)
    }
  }

  useEffect(() => {
    const socket = selectedDevice?.socket

    const handleLoadAck = () => {
      setMapLoaded(true)
      console.log('LoadAck')
    }

    const handleStartAck = () => {
      setPlaying(true)
      setScore(0)
      console.log('StartAck')
    }

    const handleEndAck = () => {
      setMapLoaded(false)
      setPlaying(false)
      handleSaveToLeaderboard()
      console.log('EndAck')
    }

    const handleEnd = () => {
      handleSaveToLeaderboard()
      console.log('End')
    }

    const handleOnHitEvent = (payload: string) => {
      const data: { points: number; reaction: number } = JSON.parse(payload)
      const player = activePlayer.current
      hit.current++
      reactionSum.current += data.reaction

      setScore((s) => s + data.points)
      if (player) {
        player.points += data.points
        player.reaction = reactionSum.current / hit.current
      }
    }

    const deviceStatusACK = (res: { status: 'active' | 'inactive' }) => {
      setDeviceConnected(res.status === 'active')
    }

    const handleMemberLeft = () => {
      handleSaveToLeaderboard()
      setDeviceConnected(false)
      selectedDevice?.socket.disconnect()
      console.log('MemberLeft')
    }

    const handleRoomComplete = () => {
      setDeviceConnected(true)
    }

    socket?.emit(CONNECTION_EVENT.DEVICE_STATUS, undefined, deviceStatusACK)

    socket?.on(GAME_EVENT.LoadAck, handleLoadAck)
    socket?.on(GAME_EVENT.StartAck, handleStartAck)
    socket?.on(GAME_EVENT.End, handleEnd)
    socket?.on(GAME_EVENT.EndAck, handleEndAck)
    socket?.on(GAME_EVENT.OnHit, handleOnHitEvent)
    socket?.on(GAME_EVENT.RoundEnd, handleSaveToLeaderboard)
    socket?.on(ROOM_EVENT.MemberLeft, handleMemberLeft)
    socket?.on(ROOM_EVENT.RoomComplete, handleRoomComplete)

    return () => {
      socket?.off(GAME_EVENT.LoadAck, handleLoadAck)
      socket?.off(GAME_EVENT.StartAck, handleStartAck)
      socket?.off(GAME_EVENT.End, handleEnd)
      socket?.off(GAME_EVENT.EndAck, handleEndAck)
      socket?.off(GAME_EVENT.OnHit, handleOnHitEvent)
      socket?.off(GAME_EVENT.RoundEnd, handleSaveToLeaderboard)
      socket?.off(ROOM_EVENT.MemberLeft, handleMemberLeft)
      socket?.off(ROOM_EVENT.RoomComplete, handleRoomComplete)
    }
  }, [selectedDevice])

  const isGameReady = playerReady && mapLoaded
  const minNameLength = playerName.length

  return (
    <div className='bg-background dark:bg-foreground game-root min-h-screen-with-header p-4 md:p-8'>
      <div className='mx-auto max-w-7xl space-y-6'>
        <div className='flex items-center gap-3'>
          <div className='bg-primary flex h-12 w-12 items-center justify-center rounded-lg'>
            <Gamepad2 className='text-primary-foreground size-6' />
          </div>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-balance'>
              Game Dashboard
            </h1>
            <p className='text-muted-foreground text-sm'>
              Control center for competitive gaming
            </p>
          </div>
        </div>

        <Card className='border-border/50 bg-card/50 backdrop-blur'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Zap className='text-primary size-5' />
              Control Panel
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Device Selection */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <h3 className='text-foreground dark:text-background text-sm font-medium'>
                  Device Connection
                </h3>
              </div>
              <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
                {devices.map((device) => {
                  if (!device.data.deviceId) return null

                  return (
                    <Button
                      key={device.data.id}
                      variant={
                        selectedDevice?.data.id === device.data.id
                          ? 'default'
                          : 'outline'
                      }
                      className='h-auto flex-col gap-2 py-4'
                      onClick={() => handleSelectVR(device)}
                      disabled={
                        connected && selectedDevice?.data.id !== device.data.id
                      }
                    >
                      <RectangleGoggles className='size-5' />
                      <span className='text-xs font-medium'>
                        {device.data.name}
                      </span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Map and Game Controls */}
            <div className='flex flex-wrap gap-3'>
              {/* New Player */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='secondary' className='flex-1 gap-2'>
                    <User /> New Player
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='space-y-4'>
                  <div className='flex flex-col gap-2'>
                    <Label htmlFor='name'>Player Name</Label>
                    <Input
                      id='name'
                      name='name'
                      value={playerName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='secondary'
                      className='flex-1'
                      disabled={!playerReady}
                      onClick={handleResetPlayer}
                    >
                      Reset
                    </Button>
                    <Button
                      variant='primary'
                      className='flex-1'
                      disabled={playerReady || minNameLength < 3}
                      onClick={handleSetPlayer}
                    >
                      Set
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Connect */}
              <Button
                variant='secondary'
                className='gpa-2 flex-1'
                onClick={handleVRConnection}
                disabled={!selectedDevice}
              >
                {connected ? (
                  <>
                    <WifiOff />
                    Disconnect
                  </>
                ) : (
                  <>
                    <Wifi />
                    Connect
                  </>
                )}
              </Button>

              {/* Load Map */}
              <Button
                variant={!mapLoaded && !isPlaying ? 'secondary' : 'destructive'}
                className='flex-1 gap-2'
                onClick={
                  !mapLoaded && !isPlaying ? handleLoadMap : handleGameExit
                }
                disabled={!connected}
              >
                {!mapLoaded && !isPlaying ? (
                  <>
                    <MapPin /> Load Map
                  </>
                ) : (
                  <>
                    <Power /> Exit Game
                  </>
                )}
              </Button>

              {/* Start Game */}
              <Button
                variant={'default'}
                className='flex-1 gap-2'
                disabled={!isGameReady}
                onClick={handleGameStart}
              >
                {isPlaying ? (
                  <>
                    <RefreshCcw />
                    Restart Game
                  </>
                ) : (
                  <>
                    <Play />
                    Start Game
                  </>
                )}
              </Button>
            </div>

            {/* Status Indicators */}
            <div className='flex flex-wrap gap-2 text-xs'>
              <div
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1',
                  connected
                    ? 'bg-accent/20 text-accent'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <div
                  className={cn(
                    'size-2 rounded-full',
                    connected ? 'bg-accent' : 'bg-muted-foreground',
                  )}
                />
                {connected ? 'Client Connected' : 'Client Disconnected'}
              </div>
              <div
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1',
                  deviceConnected
                    ? 'bg-accent/20 text-accent'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <div
                  className={cn(
                    'size-2 rounded-full',
                    deviceConnected ? 'bg-accent' : 'bg-muted-foreground',
                  )}
                />
                {deviceConnected ? 'Device Connected' : 'Device Disconnected'}
              </div>
              <div
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1',
                  mapLoaded
                    ? 'bg-accent/20 text-accent'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <div
                  className={cn(
                    'size-2 rounded-full',
                    mapLoaded ? 'bg-accent' : 'bg-muted-foreground',
                  )}
                />
                {mapLoaded ? 'Map Ready' : 'No Map'}
              </div>
              <div
                className={`flex items-center gap-2 rounded-md px-3 py-1 ${
                  isPlaying
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <div
                  className={cn(
                    'size-2 rounded-full',
                    isPlaying
                      ? 'bg-primary animate-pulse'
                      : 'bg-muted-foreground',
                  )}
                />
                {isPlaying ? 'Playing' : 'Stopped'}
              </div>
            </div>
          </CardContent>
        </Card>

        <LiveScore
          playerName={playerName}
          isPlaying={isPlaying}
          score={score}
        />

        <Card className='border-border/50 bg-card/50 backdrop-blur'>
          <CardHeader>
            <CardTitle className='flex items-center justify-between text-lg'>
              <div className='flex items-center gap-2'>
                <Trophy className='text-primary size-5' />
                Leaderboard
              </div>
              <div>
                <Dialog>
                  <DialogTrigger>
                    <Button size='icon' variant='destructive'>
                      <Trash2 />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>This action cannot be undone!</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                      You are about to clear the leaderboard.
                    </DialogDescription>
                    <DialogFooter>
                      <Button
                        variant='destructive'
                        onClick={handleClearLeaderboard}
                      >
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Leaderboard players={players} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface LiveScoreProps {
  playerName?: string
  isPlaying: boolean
  score: number
}

export function LiveScore({ isPlaying, playerName, score }: LiveScoreProps) {
  return (
    <Card className='border-primary/20 from-primary/5 to-accent/5 bg-linear-to-br backdrop-blur'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <Target className='text-primary size-5' />
          Live Score
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='bg-background/50 dark:to-primary/25 flex items-center justify-between rounded-lg p-4 backdrop-blur dark:bg-zinc-300 dark:bg-linear-to-br dark:from-zinc-300/80'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary/20 flex h-10 w-10 items-center justify-center rounded-full'>
              <User className='text-primary size-5' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Active Player</p>
              <p className='text-foreground font-mono text-lg font-semibold'>
                {playerName}
              </p>
            </div>
          </div>
          <div className='text-right'>
            <p className='text-muted-foreground text-sm'>Current Points</p>
            <p className='text-primary font-mono text-3xl font-bold'>
              {score.toLocaleString()}
            </p>
          </div>
        </div>
        {isPlaying && (
          <div className='text-accent flex items-center justify-center gap-2 text-xs'>
            <div className='bg-accent h-2 w-2 animate-pulse rounded-full' />
            Live tracking active
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function Leaderboard({ players }: { players: Player[] }) {
  const getMedalIcon = (position: number) => {
    if (position === 1) return <Medal className='text-[oklch(0.77_0.19_84)]' />
    if (position === 2) return <Medal className='text-[oklch(0.65_0.01_264)]' />
    if (position === 3) return <Medal className='text-[oklch(0.55_0.07_41)]' />
    return null
  }

  const sortedPlayers = players.sort((a, b) => {
    const playerA = a
    const playerB = b
    if (playerA.points < playerB.points) return 1
    else if (playerA.points > playerB.points) return -1
    else return 0
  })

  return (
    <div className='border-border/50 overflow-x-auto rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            <TableHead className='w-20 text-center'>Position</TableHead>
            <TableHead>Player Name</TableHead>
            <TableHead className='text-right'>Points</TableHead>
            <TableHead className='text-right'>Reaction Speed (s)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.map((player, index) => {
            const position = index + 1
            return (
              <TableRow
                key={player.name + player.points}
                className={position === 1 ? 'bg-primary/5' : ''}
              >
                <TableCell className='text-center font-medium'>
                  <div className='flex items-center justify-center gap-2'>
                    {getMedalIcon(position)}
                    {position}
                  </div>
                </TableCell>
                <TableCell className='font-mono font-medium'>
                  {player.name}
                </TableCell>
                <TableCell className='text-primary text-right font-mono font-semibold'>
                  {player.points.toLocaleString()}
                </TableCell>
                <TableCell className='text-accent text-right font-mono'>
                  {player.reaction.toFixed(3)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
