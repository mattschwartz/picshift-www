import React from 'react'
import { Route } from 'react-router'
import { Switch } from 'react-router-dom'
import Layout from './Layout'
import NotFound from './NotFound'
import routes from '../routes'

import '../styles/App.css'

const getRoutes = () => routes.map((t, idx) =>
    <Route
        key={`route-${idx}-${t.url}`}
        exact
        path={t.url}
        component={t.component}
    />
)

export default () => (
    <Layout>
        <Switch>
            {getRoutes()}
            <Route component={NotFound} />
        </Switch>
    </Layout>
)
