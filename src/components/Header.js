import React from 'react'
import { connect } from 'react-redux'
import routes from '../routes'

import '../styles/header.css'
import logo from '../res/logo.png'

const getNavlinks = (locationUrl) => routes.map((t, idx) => {
    if (locationUrl === t.url) {
        return (
            <li key={`nav${idx}-${t.url}`} className="nav-item active">
                <span className="nav-link">{t.navText} <span className="sr-only">(current)</span></span>
            </li>
        )
    } else {
        return (
            <li key={`nav${idx}-${t.url}`} className="nav-item">
                <a className="nav-link" href={t.url}>{t.navText}</a>
            </li>
        )
    }
})

const Header = ({ locationUrl }) => (
    <nav className="header navbar navbar-expand-lg">
        <a className="navbar-brand" href="/"><img className="avatar-icon" src={logo} alt="_" /> picshift</a>

        <div id="navbarSupportedContent" className="collapse navbar-collapse">
            <ul className="navbar-nav mr-auto">
                {getNavlinks(locationUrl)}
            </ul>
        </div>
    </nav>
)

export default connect(
    state => ({
        locationUrl: state.router.location.pathname
    })
)(Header)
