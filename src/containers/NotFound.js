import React from 'react'
import moment from 'moment'

import words from '../res/words.json'
import '../styles/notFound.css'

const getRandomObservation = (lastObservation) => {
    const index = Math.floor(Math.random() * words.length)
    let triesRemaining = 3
    let observation = null
    do {
        observation = words[index]
    } while (observation === lastObservation && triesRemaining-- > 0)

    return observation
}

const isNighttime = () => {
    const m = moment && moment()
    if (!m || !m.isValid()) {
        return false
    }

    const currentHour = parseFloat(m.format('HH'))

    return currentHour < 7 || currentHour > 18
}

class NotFound extends React.Component {

    setTimeoutId

    constructor(props) {
        super(props)
        this.state = {
            isNighttime: false,
            observation: false,
        }
    }

    componentWillMount() {
        this.setState({
            ...this.state,
            isNighttime: isNighttime(),
            observation: getRandomObservation()
        })

        this.setTimeoutId = setInterval(() => this.setState({
            ...this.state,
            observation: getRandomObservation(this.state.observation) || 'nothing at all...'
        }), 10000)
    }

    componentWillUnmount() {
        clearInterval(this.setTimeoutId)
    }

    render() {
        return (
            <div className="not-found container text-center">
                <h1 className="mt-5">For, oh for: page not found</h1>
                <p>Looks like there ain't nothing here, chief.</p>

                <div className={`sky ${this.state.isNighttime && 'nighttime'}`}>
                    <div className="sun">
                        <div className="sun-ray" />
                        <div className="sun-ray" style={{ animationDelay: '-6s' }} />
                        <div className="sun-ray" style={{ animationDelay: '-12s' }} />
                        <div className="sun-ray" style={{ animationDelay: '-18s' }} />
                        <div className="sun-ray" style={{ animationDelay: '-24s' }} />
                    </div>

                    {this.renderStars()}

                    <div className="cloud cloud-anim" />
                    <div className="cloud cloud-2 cloud-2-anim" />
                    <div className="grassy-gnoll" />
                    <div className="cloud-shadow cloud-anim" />
                    <div className="cloud-shadow cloud-2-shadow cloud-2-anim" />

                    {this.renderGrassBlades()}
                </div>
                <div className="observations mt-3">
                    <em>That one looks like {this.state.observation}</em>
                </div>
            </div>
        )
    }

    renderGrassBlades() {
        const renderGlassBlade = (perc) => (
            <div key={perc} className="grass-blade" style={{ left: `${perc}%` }} />
        )
        return ([
            renderGlassBlade(10),
            renderGlassBlade(20),
            renderGlassBlade(30),
            renderGlassBlade(40),
            renderGlassBlade(50),
            renderGlassBlade(60),
            renderGlassBlade(70),
            renderGlassBlade(80),
            renderGlassBlade(90),
        ])
    }

    renderStars() {
        const renderStar = (left, top) => (
            <div key={`${left}_${top}`} className="star" style={{ left, top }} />
        )

        return ([
            renderStar('1rem', '2rem'),
            renderStar('8rem', '3rem'),
            renderStar('6rem', '4rem'),
            renderStar('5rem', '1rem'),
            renderStar('7rem', '6rem'),
            renderStar('4rem', '4rem'),
            renderStar('2rem', '5rem'),
        ])
    }
}

export default NotFound
