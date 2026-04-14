import { Socket } from 'socket.io'
import Simulation from './simulator'
import { PROGRAM_EVENT } from '@virtality/shared/types'

const sim = new Simulation()

const vrCommSim = {
  programStart: (roomCode: string | string[], socket: Socket) => {
    socket.on(PROGRAM_EVENT.Start, (data) => {
      socket.emit(PROGRAM_EVENT.StartAck)
      const { exerciseData } = data
      sim.exercises = exerciseData
      sim.start(socket)
    })
  },
  programPause: (roomCode: string | string[], socket: Socket) => {
    socket.on(PROGRAM_EVENT.Pause, () => {
      console.log(PROGRAM_EVENT.Pause)
      sim.pause(socket)
      socket.emit(PROGRAM_EVENT.PauseAck)
    })
  },
  programEnd: (roomCode: string | string[], socket: Socket) => {
    socket.on(PROGRAM_EVENT.End, () => {
      console.log(PROGRAM_EVENT.End)
      sim.end()
      socket.emit(PROGRAM_EVENT.EndAck)
    })
  },
  onChangeExercise: (roomCode: string | string[], socket: Socket) => {
    socket.on(PROGRAM_EVENT.ChangeExercise, (exerciseId) => {
      console.log(PROGRAM_EVENT.ChangeExercise, exerciseId)
      sim.changeExercise(socket, exerciseId)
      socket.emit(PROGRAM_EVENT.ChangeExerciseAck)
    })
  },
  onSettingsChange: (roomCode: string | string[], socket: Socket) => {
    socket.on(PROGRAM_EVENT.SettingsChange, (data) => {
      console.log(PROGRAM_EVENT.SettingsChange, data)
      socket.emit(PROGRAM_EVENT.SettingsChangeAck)
    })
  },
  warmupStart: (roomCode: string | string[], socket: Socket) => {
    socket.on(PROGRAM_EVENT.WarmupStart, () => {
      console.log(PROGRAM_EVENT.WarmupStart)
      socket.emit(PROGRAM_EVENT.WarmupStartAck)
    })
  },
  warmupEnd: (roomCode: string | string[], socket: Socket) => {
    socket.on(PROGRAM_EVENT.WarmupEnd, () => {
      console.log(PROGRAM_EVENT.WarmupEnd)
      socket.emit(PROGRAM_EVENT.WarmupEndAck)
    })
  },
  sittingChange: (roomCode: string | string[], socket: Socket) => {
    socket.on(PROGRAM_EVENT.SittingChange, (data) => {
      console.log(PROGRAM_EVENT.SittingChange, data)
      socket.emit(PROGRAM_EVENT.SittingChangeAck)
    })
  },
}

export default vrCommSim
