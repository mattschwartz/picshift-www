import { SET_MODAL_VISIBLE, HIDE_MODAL } from '../actions/modalModule'

const initialState = {
    visibleModalId: null
}

export default function reducer(state = initialState, action) {
    switch (action.type) {
        case SET_MODAL_VISIBLE:
            return {
                ...state,
                visibleModalId: action.data
            }

        case HIDE_MODAL:
            return {
                ...state,
                visibleModalId: null
            }

        default:
            return state
    }
}
