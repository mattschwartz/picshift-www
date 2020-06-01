import React from 'react'
import Header from '../components/Header'

const Layout = ({ children }) => (
    <div style={{ overflow: 'hidden' }}>
        <Header />
        {children}
    </div>
)

export default Layout
