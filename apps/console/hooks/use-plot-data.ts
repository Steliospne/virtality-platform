'use client'
import { ProgressDataPoint } from '@/types/models'
import { useReducer } from 'react'

const usePlotData = () => {
  type State = {
    plotData: ProgressDataPoint[]
  }

  const initialState: State = {
    plotData: [],
  }

  type Action =
    | { type: 'setPlotData'; payload: State['plotData'] }
    | { type: 'updatePlotDataState'; payload: Partial<State> }

  function stateReducer(state: State, action: Action): State {
    switch (action.type) {
      case 'setPlotData':
        return { ...state, plotData: action.payload }
      case 'updatePlotDataState':
        return { ...state, ...action.payload }
      default:
        return state
    }
  }
  const [state, dispatch] = useReducer(stateReducer, initialState)

  const setPlotData = (payload: State['plotData']) => {
    dispatch({ type: 'setPlotData', payload })
  }

  const updatePlotDataState = (payload: Partial<State>) => {
    dispatch({ type: 'updatePlotDataState', payload })
  }
  return { state, handler: { setPlotData, updatePlotDataState } }
}

export default usePlotData
