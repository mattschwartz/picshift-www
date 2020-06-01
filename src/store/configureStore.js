import { applyMiddleware, combineReducers, compose, createStore } from 'redux'
import thunk from 'redux-thunk'
import { connectRouter, routerMiddleware } from 'connected-react-router'
import appReducer from './appReducer'
import modalReducer from './modalReducer'

export default function configureStore(history, initialState) {
    const reducers = {
        app: appReducer,
        modal: modalReducer
    }

    const middleware = [
        thunk,
        routerMiddleware(history)
    ]

    // In development, use the browser's Redux dev tools extension if installed
    const enhancers = []
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (isDevelopment && typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
        enhancers.push(window.__REDUX_DEVTOOLS_EXTENSION__())
    }

    const rootReducer = combineReducers({
        ...reducers,
        router: connectRouter(history)
    })

    return createStore(
        rootReducer,
        initialState,
        compose(applyMiddleware(...middleware), ...enhancers)
    )
}
