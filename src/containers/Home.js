import React from 'react'
import WelcomeFold from '../components/Home/WelcomeFold'
import SiteInfo from '../components/Home/SiteInfo'

import '../styles/home.css'
import logo from '../res/logo.png'

class Home extends React.Component {

    render() {
        return (
            <div className="home">
                <section>
                    <WelcomeFold />
                </section>
                <section>
                    <div className="please-wait">
                        <img 
                            src={logo} 
                            alt="" 
                        />
                    </div>
                </section>
                <section style={{ backgroundColor: '#233140', position: 'absolute', bottom: 0, width: '100%', }}>
                    <div className="container pb-5">
                        <div className="row text-right">
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
