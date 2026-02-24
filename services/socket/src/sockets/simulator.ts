import { Socket } from 'socket.io'
import { _EVENT } from '../types/models'

type Exercise = {
  id: string
  exerciseId: string
  reps: number
  sets: number
  restTime: number
  holdTime: number
  speed: number
}

export default class Simulation {
  status: 'started' | 'paused' | 'ready' = 'ready'
  exercises: Exercise[] = []
  currentExercise = 0
  currentSet = 0
  currentRep = 0
  simulationInterval = 750
  activeInterval?: NodeJS.Timeout

  start(socket: Socket) {
    this.status = 'started'

    this.activeInterval = setInterval(() => {
      const isLastRep =
        this.currentRep === this.exercises[this.currentExercise].reps - 1

      const isLastSet =
        this.currentSet === this.exercises[this.currentExercise].sets - 1

      const isLastExercise = this.currentExercise !== this.exercises.length - 1

      console.log(
        'currentExercise: ',
        this.currentExercise,
        'currentSet: ',
        this.currentSet,
        'currentRep: ',
        this.currentRep,
      )

      socket.emit(
        _EVENT.RepEnd.name,
        JSON.stringify({
          previousRep: this.currentRep,
          progress: Math.random(),
        }),
      )

      if (isLastRep) {
        this.currentSet++
        this.currentRep = 0

        socket.emit(
          _EVENT.SetEnd.name,
          JSON.stringify({ previousSet: this.currentSet }),
        )

        if (isLastSet) {
          if (isLastExercise) {
            socket.emit(
              _EVENT.ChangeExercise.name,
              this.exercises[this.currentExercise].id,
            )
            this.currentExercise++
            this.currentRep = 0
            this.currentSet = 0
          } else {
            console.log('programEnded')
            socket.emit(_EVENT.End.name)
            this.end()
          }
        }
      } else {
        this.currentRep++
      }
    }, this.simulationInterval)
  }

  pause(socket: Socket) {
    if (this.status === 'started') {
      clearInterval(this.activeInterval)
      this.activeInterval = undefined
      this.status = 'paused'
    } else {
      this.start(socket)
    }
  }

  end() {
    clearInterval(this.activeInterval)
    this.activeInterval = undefined
    this.currentRep = 0
    this.currentSet = 0
    this.currentExercise = 0
  }

  changeExercise(socket: Socket, id: string) {
    this.end()
    this.currentExercise = this.exercises.findIndex((ex) => ex.id === id)
    if (this.status === 'started') this.start(socket)
  }
}
