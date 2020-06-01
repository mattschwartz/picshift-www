import React from 'react'
import WelcomeFold from '../components/Home/WelcomeFold'
import SiteInfo from '../components/Home/SiteInfo'

import '../styles/home.css'

class Home extends React.Component {
    render() {
        return (
            <div className="home">
                <section>
                    <WelcomeFold />
                </section>
                <section style={{ backgroundColor: '#233140' }}>
                    <div className="container pb-5">
                        <div className="row">
                            <div className="col-sm">
                            </div>
                            <div className="col-sm">
                                <SiteInfo />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        )
    }
}

export default Home
