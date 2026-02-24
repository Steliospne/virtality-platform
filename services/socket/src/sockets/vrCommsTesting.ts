import { Socket } from 'socket.io'
import Simulation from './simulator'
import { _EVENT } from '../types/models'

const sim = new Simulation()

const vrCommSim = {
  programStart: (roomCode: string | string[], socket: Socket) => {
    socket.on(_EVENT.Start.name, (data) => {
      socket.emit(_EVENT.StartAck.name)
      const { exerciseData } = data
      sim.exercises = exerciseData
      sim.start(socket)
    })
  },
  programPause: (roomCode: string | string[], socket: Socket) => {
    socket.on(_EVENT.Pause.name, () => {
      console.log(_EVENT.Pause.name)
      sim.pause(socket)
      socket.emit(_EVENT.PauseAck.name)
    })
  },
  programEnd: (roomCode: string | string[], socket: Socket) => {
    socket.on(_EVENT.End.name, () => {
      console.log(_EVENT.End.name)
      sim.end()
      socket.emit(_EVENT.EndAck.name)
    })
  },
  onChangeExercise: (roomCode: string | string[], socket: Socket) => {
    socket.on(_EVENT.ChangeExercise.name, (exerciseId) => {
      console.log(_EVENT.ChangeExercise.name, exerciseId)
      sim.changeExercise(socket, exerciseId)
      socket.emit(_EVENT.ChangeExerciseAck.name)
    })
  },
  onSettingsChange: (roomCode: string | string[], socket: Socket) => {
    socket.on(_EVENT.SettingsChange.name, (data) => {
      console.log(_EVENT.SettingsChange.name, data)
      socket.emit(_EVENT.SettingsChangeAck.name)
    })
  },
  warmupStart: (roomCode: string | string[], socket: Socket) => {
    socket.on(_EVENT.WarmupStart.name, () => {
      console.log(_EVENT.WarmupStart.name)
      socket.emit(_EVENT.WarmupStartAck.name)
    })
  },
  warmupEnd: (roomCode: string | string[], socket: Socket) => {
    socket.on(_EVENT.WarmupEnd.name, () => {
      console.log(_EVENT.WarmupEnd.name)
      socket.emit(_EVENT.WarmupEndAck.name)
    })
  },
  sittingChange: (roomCode: string | string[], socket: Socket) => {
    socket.on(_EVENT.SittingChange.name, (data) => {
      console.log(_EVENT.SittingChange.name, data)
      socket.emit(_EVENT.SittingChangeAck.name)
    })
  },
}

export default vrCommSim
