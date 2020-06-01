import { SET_IS_LOADING } from '../actions/appModule'

const initialState = {
    isLoading: false
}

export default function reducer(state = initialState, action) {
    switch (action.type) {
        case SET_IS_LOADING:
            return {
                ...state,
                isLoading: action.data
            }

        default:
            return state
    }
}
